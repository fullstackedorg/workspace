import {basicSetup} from "codemirror";
import {keymap} from "@codemirror/view";
import {indentWithTab} from "@codemirror/commands";
import {oneDark} from "@codemirror/theme-one-dark";
import {linter} from "@codemirror/lint";
import {LanguageSupport, StreamLanguage} from "@codemirror/language";

export const getExtensions = async (filename: string) => {
    // switch delete line keybinding Shift-Mod-k for Shift-Mod-d
    (basicSetup as any).at(17).value.at(14).key = "Shift-Mod-d";


    const extensions = [
        basicSetup,
        keymap.of([indentWithTab]),
        oneDark
    ]

    if(filename.endsWith("js")
        || filename.endsWith(".jsx")
        || filename.endsWith(".ts")
        || filename.endsWith(".tsx")
    ){
        const jsLang = await import("@codemirror/lang-javascript");
        extensions.push(
            jsLang.javascript({
                typescript: filename.endsWith(".ts") || filename.endsWith(".tsx"),
                jsx: filename.endsWith("x")
            })
        );
        if(filename.endsWith("js") || filename.endsWith("jsx")){
            const eslint = await import("eslint-linter-browserify");
            extensions.push(linter(jsLang.esLint(new eslint.Linter())));
        }
    }else if(filename.endsWith(".html")){
        extensions.push((await import("@codemirror/lang-html")).html());
    }else if(filename.endsWith(".css")){
        extensions.push((await import("@codemirror/lang-css")).css());
    }else if(filename.endsWith(".json")){
        const jsonLang = await import("@codemirror/lang-json");
        extensions.push(jsonLang.json());
        extensions.push(linter(jsonLang.jsonParseLinter()));
    }else if(filename.endsWith(".sass") || filename.endsWith(".scss")){
        extensions.push((await import("@codemirror/lang-sass")).sass({
            indented: filename.endsWith(".scss")
        }));
    }else if(filename.endsWith(".md")){
        extensions.push((await import("@codemirror/lang-markdown")).markdown())
    }else if(filename.endsWith(".yml") || filename.endsWith(".yaml")){
        const {yaml} = await import('@codemirror/legacy-modes/mode/yaml');
        extensions.push(new LanguageSupport(StreamLanguage.define(yaml)));
    }else if(filename.endsWith("Dockerfile")){
        const {dockerFile} = await import('@codemirror/legacy-modes/mode/dockerfile');
        extensions.push(new LanguageSupport(StreamLanguage.define(dockerFile)));
    }

    return extensions;
}
