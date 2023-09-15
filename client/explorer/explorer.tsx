import React, {useEffect, useState} from "react";
import {Workspace} from "../workspace";
import editorIcon from "../icons/editor.svg";
import Editor from "../editor";
import Tree from "rc-tree";
import fileIcons2 from "../icons/file-icons-2.svg";
import fileIcons from "../icons/file-icons.svg";
import {EventDataNode} from "rc-tree/es/interface";
import "rc-tree/assets/index.css"
import type {LocalFS} from "../../server/Explorer/local-fs";


export default function Explorer({client}) {
    const [files, setFiles] = useState<FlatFileTree>();

    useEffect(() => {
        client.get().readDir(".")
            .then(async fileTreeRoot => {
                let files = {fileTreeRoot}
                setFiles(files);
            });
    }, [])

    const openFileEditor = (filename) => {
        Workspace.instance.addWindow({
            title: filename.length > 8 ? "..." + filename.slice(-8) : filename,
            icon: editorIcon,
            element: () => <Editor client={client} filename={filename} />
        })
    }

    if(!files) return <></>;

    return <Tree
        treeData={flatFileTreeToTreeData(files)}
        icon={item => <svg style={{fill: "white", width: 16, height: 16}}>
            <use xlinkHref={(item.data as File).isDir
                ? fileIcons2 + "#folder"
                : fileIcons + "#" + iconForFilename(item.data.title as string)}>
            </use>
        </svg>}
        onExpand={async (keys: string[], {node, expanded}) => {
            if(!keys?.length || !expanded || !node.isDir) return;
            files[node.key] = await client.get().readDir(node.key);
            setFiles( {...files});
        }}
        onSelect={(selectedKeys, data: {node: File, nativeEvent}) => {
            if(data.node.isDir || (data.nativeEvent as PointerEvent).pointerType === "mouse") return;
            openFileEditor(data.node.key);
        }}
        onDoubleClick={(_, file: EventDataNode<File>) => {
            if(file.isDir) return;
            openFileEditor(file.key);
        }}
        expandAction={"click"}
    />
}


type FlatFileTree = {
    [filePath: string]: Awaited<ReturnType<typeof LocalFS.readDir>>
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
        return [{key: Math.floor(Math.random() * 100000).toString(), title: "Loading..."}];

    return flatFileTree[fileName].filter(file => !file.name.startsWith(".")).map((file, i) => ({
        key: file.path,
        title: file.name,
        children: file.isDirectory
            ? flatFileTreeToTreeDataRecursive(file.path, flatFileTree)
            : undefined,
        isDir: file.isDirectory
    }))
}

function flatFileTreeToTreeData(files: FlatFileTree): File[] {
    return files?.fileTreeRoot?.filter(file => !file.name.startsWith(".")).map((file, i) => ({
        key: file.path,
        title: file.name,
        children: file.isDirectory
            ? flatFileTreeToTreeDataRecursive(file.path, files)
            : undefined,
        isDir: file.isDirectory
    }))
}


function iconForFilename(filename: string){
    if(filename.endsWith("compose.yml") || filename.startsWith("Dockerfile"))
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
        case "map":
            return "javascript-map";
        case "png":
        case "jpg":
            return "image";
        default:
            return "file";
    }
}
