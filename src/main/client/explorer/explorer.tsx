import React, { Component, useState } from "react";
import { Workspace } from "../workspace";
import editorIcon from "../icons/editor.svg";
import Editor from "../editor";
import Tree from "rc-tree";
import fileIcons2 from "../icons/file-icons-2.svg";
import fileIcons from "../icons/file-icons.svg";
import type { EventDataNode } from "rc-tree/es/interface";
import "rc-tree/assets/index.css"
import type { fsLocal } from "../../server/sync/fs/local";
import { client } from "../client";
import type { api } from "../../server";

export type ExplorerOptions = {
    showHiddenFiles: boolean,
    showDeleteButtons: boolean
}

export default class Explorer extends Component<{
    client: any,
    action: (item: File) => any,
    options: ExplorerOptions
}> {
    state: {
        syncedKeys: ReturnType<typeof api.savedSyncKeys>,
        files: FlatFileTree
    } = {
            syncedKeys: [],
            files: null
        }

    componentDidMount() {
        this.props.client.get().readDir("")
            .then(async fileTreeRoot => {
                let files = { fileTreeRoot }
                this.setState({ files });
            });

        this.refreshSyncedKeys();
    }

    reloadOpenedDirectories = () => {
        if (!this.state.files) return;

        Object.keys(this.state.files).forEach(async dir => {
            const files = await this.props.client.get().readDir(dir === "fileTreeRoot" ? "" : dir);
            this.setState((prevState: Explorer["state"]) => ({
                ...prevState,
                files: {
                    ...prevState.files,
                    [dir]: files
                }
            }), () => { console.log(this.state) })
        });
    }

    refreshSyncedKeys = () => {
        client.get().savedSyncKeys()
            .then(syncedKeys => this.setState({ syncedKeys }));
    }

    openFileEditor = (filename: string) => {
        Workspace.instance.addWindow({
            title: filename.length > 8 ? "..." + filename.slice(-8) : filename,
            icon: editorIcon,
            element: () => <Editor client={this.props.client} filename={filename} />
        })
    }

    render() {
        if (!this.state.files)
            return <></>;

        return <Tree
            treeData={flatFileTreeToTreeData(this.state.files, this.props.options.showHiddenFiles)}
            icon={item => <svg style={{ fill: "white", width: 16, height: 16 }}>
                <use xlinkHref={(item.data as File).isDir
                    ? fileIcons2 + "#folder"
                    : fileIcons + "#" + iconForFilename(item.data.title as string)}>
                </use>
            </svg>}
            titleRender={item => <div>
                <div className={"title"}>{item.title}</div>
                <div className={"buttons"}>
                    {this.props.action && this.props.action(item)}

                    {this.props.options.showDeleteButtons && <button className={"small danger"} onClick={async (e) => {
                        e.stopPropagation();
                        await this.props.client.delete().deleteFile(item.key)
                        let parentKey = item.key.split("/").slice(0, -1).join("/");
                        this.state.files[parentKey || "fileTreeRoot"] = await this.props.client.get().readDir(parentKey);
                        this.setState({ files: { ...this.state.files } });
                    }}>Delete</button>}

                    {this.state.syncedKeys && item.isDir && !this.state.syncedKeys.find(key => {
                        const keyParts = key.split("/");
                        const itemKeyParts = item.key.split("/");
                        for (let i = 0; i < keyParts.length; i++) {
                            if (keyParts[i] !== itemKeyParts[i])
                                return false;
                        }
                        return true;
                    }) && <SyncButton itemKey={item.key} client={this.props.client} didSync={this.refreshSyncedKeys} />}
                </div>
            </div>}
            onExpand={async (keys: string[], { node, expanded }) => {
                if (!keys?.length || !expanded || !node.isDir) return;
                this.state.files[node.key] = await this.props.client.get().readDir(node.key);
                this.setState({ files: { ...this.state.files } });
            }}
            onSelect={(selectedKeys, data: { node: File, nativeEvent }) => {
                if (data.node.isDir || (data.nativeEvent as PointerEvent).pointerType === "mouse") return;
                this.openFileEditor(data.node.key);
            }}
            onDoubleClick={(_, file: EventDataNode<File>) => {
                if (file.isDir) return;
                this.openFileEditor(file.key);
            }}
            expandAction={"click"}
        />
    }
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

function flatFileTreeToTreeDataRecursive(fileName: string, flatFileTree: FlatFileTree, showHidden): File[] | [PlaceholderFile] {
    if (!flatFileTree[fileName])
        return [{ key: Math.floor(Math.random() * 100000).toString(), title: "Loading..." }];

    return flatFileTree[fileName]
        .filter(file => showHidden || (!file.name.startsWith(".") && file.name !== "core"))
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
            .filter(file => showHidden || (!file.name.startsWith(".") && file.name !== "core"))
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


function iconForFilename(filename: string) {
    if (filename.endsWith("compose.yml") || filename.startsWith("Dockerfile"))
        return "docker";
    const extension = filename.split(".").at(-1);
    switch (extension) {
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
        case "mjs":
        case "cjs":
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

function SyncButton(props: { client, itemKey: string, didSync }) {
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
