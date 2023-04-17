import {EditorView, hoverTooltip, keymap} from "@codemirror/view";
import {indentWithTab} from "@codemirror/commands";
import {basicSetup} from "codemirror";
import {javascript} from "@codemirror/lang-javascript";
import {client} from "../client";
import {autocompletion, CompletionContext} from "@codemirror/autocomplete";
import {linter} from "@codemirror/lint";

export default async function (filename: string) {
    document.querySelector("html").style.backgroundColor = "white";
    document.body.innerHTML = "";
    document.body.style.backgroundColor = "white";

    new EditorView({
        doc: await client.get().getFileContents(filename),
        extensions: [
            basicSetup,
            keymap.of([indentWithTab]),
            javascript({
                typescript: true,
                jsx: filename.endsWith("x")
            }),
            linter(tsDiagnostics.bind(filename)),
            autocompletion({override: [tsCompletions.bind(filename)]}),
            hoverTooltip(tsTypeDefinition.bind(filename)),
        ],
        parent: document.body,
    });
}


async function tsDiagnostics(editorView: EditorView){
    await client.put().updateFile(this, editorView.state.doc.toString());
    const tsDiagnostics = await client.get().diagnostics(this);
    return tsDiagnostics.map((diagnostic) => ({
        from: diagnostic.start,
        to: diagnostic.start + diagnostic.length,
        severity: "error" as const,
        message: typeof diagnostic.messageText === 'string'
            ? diagnostic.messageText
            : diagnostic.messageText.messageText,
    }));
}

async function tsCompletions(context: CompletionContext){
    await client.put().updateFile(this, context.state.doc.toString());
    const tsCompletions = await client.get().completions(this, context.pos);

    if (!tsCompletions) return { from: context.pos, options: [] };

    const text = context.state.doc.toString();

    let lastWord, from;
    for (let i = context.pos - 1; i >= 0; i--) {
        if ([' ', '.', '\n', ':', '{', "(", "<"].includes(text[i]) || i === 0) {
            from = i === 0 ? i : i + 1;
            lastWord = text.slice(from, context.pos).trim();
            break;
        }
    }

    if (lastWord) {
        tsCompletions.entries = tsCompletions.entries.filter((completion) =>
            completion.name.startsWith(lastWord)
        );
    }

    const options = tsCompletions.entries.map((completion) => ({
        label: completion.name,
        apply: (view) => {
            view.dispatch({
                changes: { from, to: context.pos, insert: completion.name },
            });
        },
    }));

    return {
        from: context.pos,
        options,
    };
}

async function tsTypeDefinition(view: EditorView, pos: number, side: number) {
    await client.put().updateFile(this, view.state.doc.toString());

    let { from, to, text } = view.state.doc.lineAt(pos);
    let start = pos,
        end = pos;
    while (start > from && /\w/.test(text[start - from - 1])) start--;
    while (end < to && /\w/.test(text[end - from])) end++;
    if ((start == pos && side < 0) || (end == pos && side > 0)) return null;

    const type = await client.get().typeDefinition(this, pos);

    if(!type) return null;

    return {
        pos: start,
        end,
        above: true,
        create(view) {
            let dom = document.createElement('div');
            dom.innerHTML = '<pre>' + type.join('</pre><pre>') + '</pre>';
            return { dom };
        },
    };
}
