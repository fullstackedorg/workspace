import React, {useEffect, useState} from "react";
import Tree from "rc-tree";
import "rc-tree/assets/index.css"
import {client} from "../client";
import WinBox from "winbox/src/js/winbox";
// @ts-ignore
import fileIcons from "../icons/file-icons.svg";
// @ts-ignore
import fileIcons2 from "../icons/file-icons-2.svg";
import type {tsAPI} from "../../server";
import {createWinID, winStore} from "./WinStore";
import {EventDataNode} from "rc-tree/es/interface";


type FlatFileTree = {
    [filePath: string]: ReturnType<typeof tsAPI.readDir>
}

type PlaceholderFile = {
    key: string,
    title: "Loading..."
}

type File = {
    key: string,
    title: string,
    children: File[] | [PlaceholderFile],
    isDir: boolean
}

function flatFileTreeToTreeDataRecursive(fileName: string, flatFileTree: FlatFileTree): File[] | [PlaceholderFile]{
    if(!flatFileTree[fileName])
        return [{ key: Math.floor(Math.random() * 100000).toString(), title: "Loading..." }];

    return flatFileTree[fileName].map((file, i) => ({
        key: file.path,
        title: file.name,
        children: file.isDirectory
            ? flatFileTreeToTreeDataRecursive(file.path, flatFileTree)
            : undefined,
        isDir: file.isDirectory
    }))
}

function flatFileTreeToTreeData(files: FlatFileTree): File[] {
    return files?.root?.map((file, i) => ({
        key: file.path,
        title: file.name,
        children: file.isDirectory
            ? flatFileTreeToTreeDataRecursive(file.path, files)
            : undefined,
        isDir: file.isDirectory
    }))
}

export default function () {
    const [files, setFiles] = useState<FlatFileTree>();

    useEffect(() => {client.get().readDir(".").then(root => setFiles({root}));}, [])

    return <Tree
        treeData={flatFileTreeToTreeData(files)}
        icon={item => <svg style={{fill: "white", width: 16, height: 16}}>
            <use xlinkHref={(item.data as File).isDir
                ? fileIcons2 + "#folder"
                : fileIcons + "#" + iconForFilename(item.data.title as string)}>
            </use>
        </svg>}
        onExpand={async (keys: string[]) => {
            if(!keys?.length) return;
            const contents = await Promise.all(keys.map(key => client.get(true).readDir(key)));
            contents.forEach((content, i) => files[keys[i]] = content);
            setFiles( {...files});
        }}
        onSelect={(_, data: {node: File, nativeEvent}) => {
            if(data.node.isDir || (data.nativeEvent as PointerEvent).pointerType === "mouse") return;
            const id = createWinID();
            const winBox = new WinBox(data.node.key, {url: `${window.location.href}?edit=${data.node.key}&winId=${id}`});
            winStore.set(id, winBox);
        }}
        onDoubleClick={(_, file: EventDataNode<File>) => {
            if(file.isDir) return;
            const id = createWinID();
            const winBox = new WinBox(file.key, {url: `${window.location.href}?edit=${file.key}&winId=${id}`});
            winStore.set(id, winBox);

        }}
    />
}


function iconForFilename(filename: string){
    if(filename === "docker-compose.yml" || filename === "Dockerfile")
        return "docker";
    const extension = filename.split(".").at(-1);
    switch (extension){
        case "ts":
            return "typescript";
        case "tsx":
            return "react";
        case "json":
            return "json";
        case "html":
            return "html";
        case "css":
            return "css";
        case "js":
            return "javascript";
        case "png":
            return "image";
        default:
            return "file";
    }
}
