import {EditorView, hoverTooltip, keymap} from "@codemirror/view";
import {indentWithTab} from "@codemirror/commands";
import {basicSetup} from "codemirror";
import {client} from "../client";
import {autocompletion, Completion, CompletionContext} from "@codemirror/autocomplete";
import {linter} from "@codemirror/lint";
import {oneDark} from "@codemirror/theme-one-dark";
import { StreamLanguage, LanguageSupport } from "@codemirror/language";

export default async function (filename: string) {
    document.querySelector("html").style.backgroundColor = "#282c34";
    document.body.innerHTML = "";
    document.body.style.backgroundColor = "#282c34";

    const extensions = [
        basicSetup,
        keymap.of([indentWithTab]),
        oneDark,
        // linter(tsDiagnostics.bind(filename)),
        // autocompletion({override: [tsCompletions.bind(filename)]}),
        // hoverTooltip(tsTypeDefinition.bind(filename)),
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

    const editor = new EditorView({
        doc: await client.get().getFileContents(filename),
        extensions,
        parent: document.body,
    });

    window.addEventListener("keydown", e => {
        if(e.key !== "s" || (!e.ctrlKey && !e.metaKey)) return;

        e.preventDefault();
        client.put().updateFile(filename, editor.state.doc.toString());
    });
    window.addEventListener("blur", () =>
        client.put().updateFile(filename, editor.state.doc.toString()));
}
//
//
// async function tsDiagnostics(editorView: EditorView){
//     await client.put().updateFile(this, editorView.state.doc.toString());
//     const tsDiagnostics = await client.get().diagnostics(this);
//
//     return tsDiagnostics.map((diagnostic) => ({
//         from: diagnostic.start,
//         to: diagnostic.start + diagnostic.length,
//         severity: "error" as const,
//         message: typeof diagnostic.messageText === 'string'
//             ? diagnostic.messageText
//             : diagnostic.messageText.messageText,
//     }));
// }
//
// async function tsCompletions(context: CompletionContext){
//     await client.put().updateFile(this, context.state.doc.toString());
//     const tsCompletions = await client.get().completions(this, context.pos);
//
//     if (!tsCompletions) return { from: context.pos, options: [] };
//
//     const text = context.state.doc.toString();
//
//     let lastWord, from;
//     for (let i = context.pos - 1; i >= 0; i--) {
//         if ([' ', '.', '\n', ':', '{', "(", "<", "/", "\"", "'"].includes(text[i]) || i === 0) {
//             from = i === 0 ? i : i + 1;
//             lastWord = text.slice(from, context.pos).trim();
//             break;
//         }
//     }
//
//     if (lastWord) {
//         tsCompletions.entries = tsCompletions.entries.filter((completion) =>
//             completion.name.startsWith(lastWord)
//         );
//     }
//
//     const options: Completion[] = tsCompletions.entries.map((completion) => ({
//         label: completion.name,
//         apply: async (view) => {
//             view.dispatch({
//                 changes: {
//                     from,
//                     to: context.pos,
//                     insert: completion.name
//                 }
//             });
//
//             if(from === context.pos) {
//                 view.dispatch({
//                     selection: {
//                         anchor: from + completion.name.length,
//                         head: from + completion.name.length,
//                     }
//                 })
//             }
//         },
//     }));
//
//     return {
//         from: context.pos,
//         options,
//     };
// }
//
// async function tsTypeDefinition(view: EditorView, pos: number, side: number) {
//     await client.put().updateFile(this, view.state.doc.toString());
//
//     let { from, to, text } = view.state.doc.lineAt(pos);
//     let start = pos,
//         end = pos;
//     while (start > from && /\w/.test(text[start - from - 1])) start--;
//     while (end < to && /\w/.test(text[end - from])) end++;
//     if ((start == pos && side < 0) || (end == pos && side > 0)) return null;
//
//     const type = await client.get().typeDefinition(this, pos);
//
//     if(!type) return null;
//
//     return {
//         pos: start,
//         end,
//         above: true,
//         create(view) {
//             let dom = document.createElement('div');
//             dom.innerText = type;
//             return { dom };
//         },
//     };
// }
