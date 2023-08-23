import React, {useEffect, useState} from "react";
import Tree from "rc-tree";
import "rc-tree/assets/index.css"
import {client} from "../client";
import fileIcons from "../icons/file-icons.svg";
import fileIcons2 from "../icons/file-icons-2.svg";
import type {API} from "../../server";
import {EventDataNode} from "rc-tree/es/interface";
import { Workspace } from "../workspace";
import explorerIcon from "../icons/explorer.svg";
import Editor from "../editor";

type FlatFileTree = {
    [filePath: string]: ReturnType<typeof API.readDir>
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
    return files?.root?.filter(file => !file.name.startsWith(".")).map((file, i) => ({
        key: file.path,
        title: file.name,
        children: file.isDirectory
            ? flatFileTreeToTreeDataRecursive(file.path, files)
            : undefined,
        isDir: file.isDirectory
    }))
}

function Explorer(props: {dir?: string}) {
    const [files, setFiles] = useState<FlatFileTree>();

    useEffect(() => {
        client.get().readDir(".")
            .then(async root => {
                let files = {root}
                if(!props.dir){
                    setFiles(files);
                    return;
                }

                const pathComponents = props.dir.split("/").map(c => c.trim()).filter(Boolean);

                // shift /home
                pathComponents.shift();

                for (let i = 0; i < pathComponents.length; i++) {
                    const path = pathComponents.slice(0, i + 1).join("/");
                    files[path] = await client.get().readDir(path);
                }
                setFiles({...files});
            });
        }, [])

    const openFileEditor = (filename) => {
        Workspace.instance.addWindow({
            title: filename,
            icon: "",
            element: () => <Editor filename={filename} />
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
        defaultExpandedKeys={(() => {
            if(!props.dir) return [];

            const pathComponents = props.dir.split("/").map(c => c.trim()).filter(Boolean);
            pathComponents.shift();
            return pathComponents.map((_, i) => pathComponents.slice(0, i + 1).join("/"))
        })()}
        defaultSelectedKeys={(() => {
            if(!props.dir) return [];

            const pathComponents = props.dir.split("/").map(c => c.trim()).filter(Boolean);
            pathComponents.shift();
            return [pathComponents.join("/")]
        })()}
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

Workspace.apps.push({
    title: "Explorer",
    icon: explorerIcon,
    element: () => <Explorer />
})
