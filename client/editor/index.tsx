import {EditorView} from "@codemirror/view";
import React, {useEffect, useRef} from "react";
import {getExtensions} from "./common";


async function initEditor(client, filename: string, container: HTMLDivElement) {
    const editor = new EditorView({
        doc: await client.get().getFileContents(filename),
        extensions: await getExtensions(filename),
        parent: container,
    });

    container.addEventListener("keydown", e => {
        if(e.key !== "s" || (!e.ctrlKey && !e.metaKey)) return;

        e.preventDefault();
        client.put().updateFile(filename, editor.state.doc.toString());
    });
    editor.contentDOM.addEventListener("blur", () =>
        client.put().updateFile(filename, editor.state.doc.toString()));
}

export default function (props: {filename: string, client}) {
    const containerRef = useRef<HTMLDivElement>();

    useEffect(() => {
        initEditor(props.client, props.filename, containerRef.current)
    }, []);

    return <div ref={containerRef} style={{height: "100%"}} />
}
