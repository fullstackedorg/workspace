import {EditorView} from "@codemirror/view";
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
            javascript({
                typescript: true,
                jsx: filename.endsWith("x")
            }),
            linter(updateDocAndLint.bind(filename)),
            autocompletion({override: [tsCompletions.bind(filename)]}),
        ],
        parent: document.body,
    });
}


async function updateDocAndLint(editorView: EditorView){
    const tsErrors = await client.post().updateDoc(this, editorView.state.doc.toString());
    return tsErrors.map((tsError) => ({
        from: tsError.start,
        to: tsError.start + tsError.length,
        severity: "error" as const,
        message: typeof tsError.messageText === 'string'
            ? tsError.messageText
            : tsError.messageText.messageText,
    }));
}

async function tsCompletions(context: CompletionContext){
    let tsCompletions = await client.put().updateCompletions(this, context.pos, context.state.doc.toString());

    if (!tsCompletions) return { from: context.pos, options: [] };

    const text = context.state.doc.toString();

    let lastWord, from;
    for (let i = context.pos - 1; i >= 0; i--) {
        if ([' ', '.', '\n', ':', '{'].includes(text[i]) || i === 0) {
            from = i === 0 ? i : i + 1;
            lastWord = text.slice(from, context.pos).trim();
            break;
        }
    }

    if (lastWord) {
        console.log(lastWord)
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
