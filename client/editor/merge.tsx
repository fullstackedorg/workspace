import {MergeView} from "@codemirror/merge"
import React, {useEffect, useRef, useState} from "react";
import {getExtensions} from "./common";
import {fsLocal} from "../explorer/clients/local";
import {fsCloud} from "../explorer/clients/cloud";

async function initMerge(container: HTMLDivElement, {baseKey, fileKey}) {
    const extensions = await getExtensions(fileKey);

    const path = baseKey + "/" + fileKey;
    return new MergeView({
        a: {
            doc: await fsLocal.get().getFileContents(path),
            extensions
        },
        b: {
            doc: await fsCloud.get().getFileContents(path),
            extensions
        },
        revertControls: "b-to-a",
        parent: container
    });
}


export default function (props: {baseKey: string, fileKey: string, didResolve(): void}) {
    const containerRef = useRef<HTMLDivElement>();
    const [mergeView, setMergeView] = useState<MergeView>();

    useEffect(() => {
        initMerge(containerRef.current, props).then(setMergeView)
    }, []);

    return <>
        <button onClick={() => {
            fsLocal.post().resolveConflict(props.baseKey, props.fileKey, mergeView.a.state.doc.toString());
            props.didResolve();
        }}>Mark Resolved</button>
        <div ref={containerRef} style={{
            height: "calc(100% - 34px)",
            overflow: "auto"
        }}  />
    </>
}
