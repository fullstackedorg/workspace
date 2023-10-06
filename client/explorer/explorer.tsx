import React, {useEffect, useState} from "react";
import {Workspace} from "../workspace";
import editorIcon from "../icons/editor.svg";
import Editor from "../editor";
import Tree from "rc-tree";
import fileIcons2 from "../icons/file-icons-2.svg";
import fileIcons from "../icons/file-icons.svg";
import type {EventDataNode} from "rc-tree/es/interface";
import "rc-tree/assets/index.css"
import type {fsLocal} from "../../server/sync/fs-local";
import useAPI from "@fullstacked/webapp/client/react/useAPI";
import {client as mainClient} from "../client";

export type ExplorerOptions = {
    showHiddenFiles: boolean,
    showDeleteButtons: boolean
}

export default function Explorer(props: {client: any, action: (item: File) => any, options: ExplorerOptions}) {
    const [syncedKeys, refreshSyncedKeys] = useAPI(mainClient.get().getSyncedKeys);
    const [files, setFiles] = useState<FlatFileTree>();

    useEffect(() => {
        props.client.get().readDir("")
            .then(async fileTreeRoot => {
                let files = {fileTreeRoot}
                setFiles(files);
            });
    }, []);

    const openFileEditor = (filename) => {
        Workspace.instance.addWindow({
            title: filename.length > 8 ? "..." + filename.slice(-8) : filename,
            icon: editorIcon,
            element: () => <Editor client={props.client} filename={filename} />
        })
    }

    if(!files) return <></>;

    return <Tree
        treeData={flatFileTreeToTreeData(files, props.options.showHiddenFiles)}
        icon={item => <svg style={{fill: "white", width: 16, height: 16}}>
            <use xlinkHref={(item.data as File).isDir
                ? fileIcons2 + "#folder"
                : fileIcons + "#" + iconForFilename(item.data.title as string)}>
            </use>
        </svg>}
        titleRender={item => <div>
            <div className={"title"}>{item.title}</div>
            <div className={"buttons"}>
                {props.action && props.action(item)}
                {props.options.showDeleteButtons && <button className={"small danger"} onClick={async (e) => {
                    e.stopPropagation();
                    await props.client.delete().deleteFile(item.key)
                    let parentKey = item.key.split("/").slice(0, -1).join("/");
                    files[parentKey || "fileTreeRoot"] = await props.client.get().readDir(parentKey);
                    setFiles({...files});
                }}>Delete</button>}
                {syncedKeys && item.isDir && !item.key.startsWith(".") && !syncedKeys.find(key => {
                        const keyParts = key.split("/");
                        const itemKeyParts = item.key.split("/");
                        for (let i = 0; i < keyParts.length; i++){
                            if(keyParts[i] !== itemKeyParts[i])
                                return false;
                        }
                        return true;
                    }) && <SyncButton itemKey={item.key} client={props.client} didSync={refreshSyncedKeys}/> }
            </div>
        </div>}
        onExpand={async (keys: string[], {node, expanded}) => {
            if(!keys?.length || !expanded || !node.isDir) return;
            files[node.key] = await props.client.get().readDir(node.key);
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
    [filePath: string]: Awaited<ReturnType<typeof fsLocal.readDir>>
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

function flatFileTreeToTreeDataRecursive(fileName: string, flatFileTree: FlatFileTree, showHidden): File[] | [PlaceholderFile]{
    if(!flatFileTree[fileName])
        return [{key: Math.floor(Math.random() * 100000).toString(), title: "Loading..."}];

    return flatFileTree[fileName]
        .filter(file => showHidden || !file.name.startsWith("."))
        .map((file, i) => ({
            key: file.key,
            title: file.name,
            children: file.isDirectory
                ? flatFileTreeToTreeDataRecursive(file.key, flatFileTree, showHidden)
                : undefined,
            isDir: file.isDirectory
        }))
}

function flatFileTreeToTreeData(files: FlatFileTree, showHidden): File[] {
    return files?.fileTreeRoot
        ? files?.fileTreeRoot
            .filter(file => showHidden || !file.name.startsWith("."))
            .map((file, i) => ({
                key: file.key,
                title: file.name,
                children: file.isDirectory
                    ? flatFileTreeToTreeDataRecursive(file.key, files, showHidden)
                    : undefined,
                isDir: file.isDirectory
            }))
        : []
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

function SyncButton(props: {client, itemKey: string, didSync}){
    const [syncing, setSyncing] = useState(false)

    return syncing ? <small>Syncing...</small> : <button className={"small"} onClick={(e) => {
        e.stopPropagation();
        setSyncing(true)
        props.client.post().sync(props.itemKey).then(() => {
            setSyncing(false);
            props.didSync();
        });
    }}>Sync</button>
}
