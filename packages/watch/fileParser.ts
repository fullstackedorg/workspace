type TokenDynamicImport = {
    line: number,
    statement: string[]
}

export function tokenizeImports(content): {
    lines: [number, number],
    statements: string[][],
    dynamics: TokenDynamicImport[]
} {
    if (!content || typeof content !== 'string') return null;

    const statements = [];
    const dynamics = [];

    let accumulator = [""],
        line = 0,
        lineStart, lineEnd,
        inComment = false,
        inImportStatement = false,
        inNamingImport = false,
        inModuleName = false,
        inDynamicImport = false;
    for (const char of content) {
        if (char === "\n") line++;

        /*
        * File was starting with comment
        *
        * // foo bar baz
        *
        * import ...
        */
        if (inComment && char === "\n") {
            inComment = false;
            accumulator = [""];
            continue;
        }


        if (!char.trim()) {
            if (accumulator[accumulator.length - 1] !== "")
                accumulator.push("");

            continue;
        }

        /*
        *
        * import { export1, export2 } from "module-name"
        *                 ⌃ Here
        */
        if (inImportStatement && char === ",") {
            accumulator.push(",");
            accumulator.push("");
            continue;
        }

        /*
        *
        * import { export1, export2} from "module-name"
        *                          ⌃ Here
        */
        if (inNamingImport && char === "}") {
            inNamingImport = false;
            if (accumulator[accumulator.length - 1] !== "")
                accumulator.push("");
        }

        /*
        *
        * await import("module-name")
        *             ⌃ Here
        */
        if (inDynamicImport && char === "(") {
            accumulator.push("(")
            accumulator.push("");
            continue;
        }

        /*
        *
        * await import("module-name")
        *                           ⌃ Here
        */
        if (inDynamicImport && char === ")") {
            accumulator.push(char);
            dynamics.push({
                line,
                statement: accumulator
            });
            inDynamicImport = false;
            accumulator = [];
            continue;
        }

        accumulator[accumulator.length - 1] += char;

        const currentWord = accumulator[accumulator.length - 1];

        if (inComment) continue;

        if (currentWord === "//") {
            inComment = true;
        }

        /*
        *
        * import { export1, export2 } from "module-name"
        * ⌃ Here
        */
        if (currentWord === "import" && accumulator.length === 1) {
            if (lineStart === undefined)
                lineStart = line;

            lineEnd = line;

            inImportStatement = true;
        }

        /*
        *
        * import { export1, export2 } from "module-name"
        *        ⌃ Here
        */
        if (inImportStatement && char === "{") {
            inNamingImport = true;
            accumulator.push("");
        }

        /*
        *
        * import ... from "module-name"
        *                             ⌃ Here
        */
        if (inImportStatement && inModuleName && (char === "\"" || char === "'")) {
            statements.push(accumulator.splice(0, accumulator.length));
            inModuleName = false;
            inImportStatement = false;
        }

        /*
        *
        * import ... from "module-name"
        *                 ⌃ Here
        */
        if (inImportStatement && !inNamingImport && (char === "\"" || char === "'")) {
            inModuleName = true;
        }

        /*
        *
        * await import("module-name")
        *       ⌃ Here
        */
        if (currentWord === "import" && accumulator.length > 1) {
            inDynamicImport = true;
            accumulator = accumulator.slice(accumulator.length - 1);
        }

    }

    return {
        lines: [lineStart, lineEnd],
        statements,
        dynamics
    };
}

export type ImportDefinition = {
    module: string,
    type?: boolean,
    defaultImports?: string[],
    namespaceImports?: string[],
    namedImports?: {
        name: string,
        alias, string
    }[]
}

export function analyzeRawImportStatement(importStatement: string[]) : ImportDefinition {
    if (!Array.isArray(importStatement)
        || importStatement.length === 0
        || importStatement.at(0) !== "import")
        return null;

    const indexOfFrom = importStatement.indexOf("from");

    const definition: ImportDefinition = {
        module: importStatement.at(-1).slice(1, -1)
    }

    // Side effect import
    // import "./module"
    if (indexOfFrom === -1) {
        return definition;
    }

    const importations = importStatement.slice(1, indexOfFrom);

    let accumulator = [],
        defaultImports = [],
        namespaceImports = [],
        namedImports = [],
        inNamedImport = false,
        foundType = false;

    const analyzeAccumulator = () => {
        if (!accumulator.length) return;

        if (accumulator.length > 1) {

            if (inNamedImport) {
                namedImports.push({
                    name: accumulator.at(0),
                    alias: accumulator.at(-1)
                })
            } else {
                namespaceImports.push(accumulator.at(-1));
            }

        } else {

            if (inNamedImport) {
                namedImports.push({ name: accumulator.at(0) })
            } else {
                defaultImports.push(accumulator.at(0));
            }

        }

        accumulator = [];
    }

    for (const word of importations) {
        if(word === "type"){
            foundType = true;
            continue;
        }

        if (word === ",") {
            analyzeAccumulator();
            continue;
        }

        if (word === "{") {
            inNamedImport = true;
            continue;
        }

        if (word === "}") {
            analyzeAccumulator();
            inNamedImport = false;
            continue;
        }

        accumulator.push(word);
    }

    analyzeAccumulator();

    if (defaultImports.length)
        definition.defaultImports = defaultImports;

    if (namespaceImports.length)
        definition.namespaceImports = namespaceImports;

    if (namedImports.length)
        definition.namedImports = namedImports;

    if (foundType)
        definition.type = true;

    return definition;
}


function namedDefinitionHasNamedImport(namedDefinition, namedImport): boolean {
    for (const named of namedDefinition) {
        if (named.name === namedImport.name && named.alias === namedImport.alias)
            return true;
    }
    return false;
}

type MergedImportDefinition = {
    type?: boolean,
    defaultImports?: Set<string>,
    namespaceImports?: Set<string>,
    namedImports?: {
        name: string,
        alias: string
    }[],
    line?: number
};
type ModuleName = string;
type MergedImportDefinitions = Map<ModuleName, MergedImportDefinition>;

export function mergeImportsDefinitions(definitions: ImportDefinition[]): MergedImportDefinitions {
    if (!Array.isArray(definitions))
        return null;

    const importsDefinition: MergedImportDefinitions = new Map();

    for (const definition of definitions) {
        if (!definition.module) continue;

        let moduleDef: MergedImportDefinition = importsDefinition.get(definition.module);
        if (!moduleDef)
            moduleDef = {};

        if (definition.type)
            moduleDef.type = true;

        if (definition.defaultImports) {
            if (!moduleDef.defaultImports)
                moduleDef.defaultImports = new Set();

            definition.defaultImports.forEach(defaultImport => moduleDef.defaultImports.add(defaultImport));
        }

        if (definition.namespaceImports) {
            if (!moduleDef.namespaceImports)
                moduleDef.namespaceImports = new Set();

            definition.namespaceImports.forEach(namespaceImport => moduleDef.namespaceImports.add(namespaceImport));
        }

        if (definition.namedImports) {
            if (!moduleDef.namedImports)
                moduleDef.namedImports = [];

            for (const namedImport of definition.namedImports) {
                if (!namedDefinitionHasNamedImport(moduleDef.namedImports, namedImport))
                    moduleDef.namedImports.push(namedImport);
            }
        }


        importsDefinition.set(definition.module, moduleDef);
    }

    return importsDefinition;
}

/*
*
* import MyModule from "./myModule"
*
* => const module0 = await import("./myModule"); const MyModule = module0.default;
*
*/
export function convertImportDefinitionToAsyncImport(
    moduleName: ModuleName,
    importDefinition: MergedImportDefinition,
    moduleIntermediateName?: string,
    moduleResolverWrapperFunction?: string,
    forceNamedImport?: boolean) : string[] {
    if (typeof moduleName !== "string") return null;

    if (moduleName.endsWith(".css")) return [];

    const fileLoader = [
        ".png",
        ".jpg",
        ".svg",
        ".webp",
        ".gif",
        ".woff",
        ".woff2",
        ".ttf",
        ".otf",
        ".json",
        ".wasm"
    ].find(ext => moduleName.endsWith(ext));
    if (fileLoader) {
        return [
            moduleResolverWrapperFunction
                ? `const ${Array.from(importDefinition.defaultImports).join(", ")} = ${moduleResolverWrapperFunction}("${moduleName}");`
                : `const ${Array.from(importDefinition.defaultImports).join(", ")} = "${moduleName}";`
        ]
    }

    if(importDefinition?.type){
        let importations = [];
        importDefinition.defaultImports?.forEach(defaultImport => {
            importations.push(defaultImport)
        });

        importDefinition.namespaceImports?.forEach(nsImport => {
            importations.push(`* as ${nsImport}`);
        });

        importDefinition.namedImports?.forEach((namedImport, i) => {
            let importation = i === 0 ? "{ " : "";

            if (namedImport.alias) {
                importation += `${namedImport.name} as ${namedImport.alias}`;
            } else {
                importation += namedImport.name;
            }

            if(i === importDefinition.namedImports.length - 1) importation += " }";

            importations.push(importation);
        });

        return [ `import type ${importations.join(" ,")} from "${moduleName}";` ]
    }

    let importString = moduleResolverWrapperFunction
        ? `await import(${moduleResolverWrapperFunction}("${moduleName}"));`
        : `await import("${moduleName}");`;

    if (!(importDefinition?.defaultImports || importDefinition?.namespaceImports || importDefinition?.namedImports))
        return [importString];

    moduleIntermediateName = moduleIntermediateName ?? "module0";

    const asyncImportStatement = forceNamedImport
        ? [`const { ${moduleIntermediateName} } = ${importString}`]
        : [`const ${moduleIntermediateName} = ${importString}`];

    importDefinition.defaultImports?.forEach(defaultImport => {
        asyncImportStatement.push(`const ${defaultImport} = ${moduleIntermediateName}.default;`);
    });

    importDefinition.namespaceImports?.forEach(nsImport => {
        asyncImportStatement.push(`const ${nsImport} = ${moduleIntermediateName};`);
    });

    importDefinition.namedImports?.forEach(namedImport => {
        if (namedImport.alias) {
            asyncImportStatement.push(`const ${namedImport.alias} = ${moduleIntermediateName}.${namedImport.name};`);
        } else {
            asyncImportStatement.push(`const { ${namedImport.name} } = ${moduleIntermediateName};`);
        }
    });

    return asyncImportStatement;
}


export function replaceLines(from: number, to: number, content: string, data: string): string {
    if (typeof from !== "number" || typeof to !== "number") return content;
    if (to < from) return content;
    if (typeof data !== "string" || typeof content !== "string") return content;

    let contentLines = content.split("\n");

    if (from > contentLines.length - 1) return content;
    if (to > contentLines.length - 1) return content;

    contentLines[from] = data;
    for (let i = from + 1; i <= to; i++) {
        contentLines[i] = "";
    }
    return contentLines.join("\n");
}

type AnalysedDynamicImport = {
    module: string,
    line: number
}

/*
*
* ["import", "(", "\"module-name\"", ")"]
*
*/
export function analyzeDynamicImport(dynamicImport): AnalysedDynamicImport {
    const indexOfFirstParenthesis = dynamicImport.statement.indexOf("(");
    const indexOfLastParenthesis = dynamicImport.statement.indexOf(")");

    const isolatedModuleName = dynamicImport.statement.slice(indexOfFirstParenthesis + 1, indexOfLastParenthesis);

    if (isolatedModuleName.length !== 1
        || isolatedModuleName.at(0).includes("+")
        || !isolatedModuleName.at(0).match(/^(".*"|'.*')$/)) return null;

    const module = isolatedModuleName.at(0).slice(1, -1)
    return {
        module,
        line: dynamicImport.line
    }
}

export function reconstructDynamicImport(moduleName: string, moduleResolverWrapperFunction?: string) {
    return moduleResolverWrapperFunction
        ? `import(${moduleResolverWrapperFunction}("${moduleName}"))`
        : `import("${moduleName}")`
}
