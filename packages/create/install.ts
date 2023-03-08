import {argsSpecs} from "./args";
import CLIParser from "fullstacked/utils/CLIParser";
import fs from "fs";
import {resolve} from "path";
import {fileURLToPath} from "url";
import {globSync} from "glob";
import {execSync} from "child_process";

export default async function (){
    const {templates, projectDir} = CLIParser.getCommandLineArgumentsValues(argsSpecs);

    if(!templates) return;

    const dependencies = new Set<string>();
    const packageToIgnore = new Set<string>();
    const filesToCopy: {
        dir: boolean,
        from: string,
        to: string
    }[] = [];

    for (const templateName of templates){
        const location = new URL(`./templates/${templateName}`, import.meta.url);

        if(!fs.existsSync(location))
            throw Error(`Template [${templateName}] is not available.`);

        const templatePath = fileURLToPath(location);
        const configFile = resolve(templatePath, "config.json");
        const config = fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile).toString()) : {};

        config.dependencies?.forEach(dependency => dependencies.add(dependency));
        config.ignore?.forEach(packageName => packageToIgnore.add(packageName));

        const files = globSync(["**/*.ts", "**/*.tsx"], {cwd: templatePath});

        files.forEach(file => {
            const dir = fs.statSync(resolve(templatePath, file)).isDirectory()

            if(!dir && fs.existsSync(resolve(projectDir, file)))
                throw Error(`The file [${file}] already exists in your project`);

            filesToCopy.push({
                dir,
                from: resolve(templatePath, file),
                to: resolve(projectDir, file)
            });
        });
    }

    dependencies.add("@fullstacked/webapp");

    execSync(`npm i ${Array.from(dependencies).join(" ")}`, {stdio: "inherit"});

    filesToCopy.forEach(toCopy => {
        if(toCopy.dir) fs.mkdirSync(toCopy.to, {recursive: true});
        else fs.cpSync(toCopy.from, toCopy.to);
    })
}
