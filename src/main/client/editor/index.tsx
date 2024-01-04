import { EditorView } from "@codemirror/view";
import React, { useEffect, useRef } from "react";
import { getExtensions } from "./common";
import { fsClient } from "../explorer/fs";


async function initEditor(origin: string, filename: string, container: HTMLDivElement) {
    const editor = new EditorView({
        doc: await fsClient.get().getFileContents(origin, filename),
        extensions: await getExtensions(filename),
        parent: container,
    });

    container.addEventListener("keydown", e => {
        if (e.key !== "s" || (!e.ctrlKey && !e.metaKey)) return;

        e.preventDefault();
        fsClient.put().updateFile(origin, filename, editor.state.doc.toString());
    });
    editor.contentDOM.addEventListener("blur", () =>
        fsClient.put().updateFile(origin, filename, editor.state.doc.toString()));
}

export default function (props: { filename: string, origin: string }) {
    const containerRef = useRef<HTMLDivElement>();

    useEffect(() => {
        initEditor(props.origin, props.filename, containerRef.current)
    }, []);

    return <div ref={containerRef} style={{ height: "100%" }} />
}
