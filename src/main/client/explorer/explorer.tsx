import React, { Component } from "react";
import { Workspace } from "../workspace";
import editorIcon from "../icons/editor.svg";
import Editor from "../editor";
import Tree from "rc-tree";
import fileIcons2 from "../icons/file-icons-2.svg";
import fileIcons from "../icons/file-icons.svg";
import type { EventDataNode } from "rc-tree/es/interface";
import "rc-tree/assets/index.css"
import { fsClient } from "./fs";
import type fsType from "../../server/sync/fs";

export type ExplorerOptions = {
    showHiddenFiles: boolean,
    showDeleteButtons: boolean
}

export default class Explorer extends Component<{
    origin: string,
    action: (item: File) => any,
    options: ExplorerOptions
}> {
    state: {
        files: FlatFileTree
    } = {
            files: null
        }

    loadNewOrigin() {
        const weakOrigin = this.props.origin;

        const loadRoot = () => {
            fsClient.get().readDir(this.props.origin, "")
                .then(async fileTreeRoot => {
                    let files = { fileTreeRoot }
                    if(weakOrigin !== this.props.origin)
                        return;

                    this.setState({ files });
                });
        }

        this.setState({ files: null }, loadRoot)
    }

    componentDidMount() {
        this.loadNewOrigin()
    }

    componentDidUpdate(prevProps: Readonly<{ origin: string; action: (item: File) => any; options: ExplorerOptions; }>, prevState: Readonly<{}>, snapshot?: any): void {
        // new origin
        if (prevProps.origin !== this.props.origin) {
            this.loadNewOrigin();
        }
    }

    reloadOpenedDirectories = () => {
        if (!this.state.files) return;

        Object.keys(this.state.files).forEach(async dir => {
            const files = await fsClient.get().readDir(this.props.origin, dir === "fileTreeRoot" ? "" : dir);
            this.setState((prevState: Explorer["state"]) => ({
                ...prevState,
                files: {
                    ...prevState.files,
                    [dir]: files
                }
            }), () => { console.log(this.state) })
        });
    }

    openFileEditor = (filename: string) => {
        Workspace.instance.addWindow({
            title: filename.length > 8 ? "..." + filename.slice(-8) : filename,
            icon: editorIcon,
            element: () => <Editor origin={this.props.origin} filename={filename} />
        });
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
                        await fsClient.delete().deleteFile(this.props.origin, item.key)
                        let parentKey = item.key.split("/").slice(0, -1).join("/");
                        this.state.files[parentKey || "fileTreeRoot"] = await fsClient.get().readDir(this.props.origin, parentKey);
                        this.setState({ files: { ...this.state.files } });
                    }}>Delete</button>}
                </div>
            </div>}
            onExpand={async (keys: string[], { node, expanded }) => {
                if (!keys?.length || !expanded || !node.isDir) return;
                this.state.files[node.key] = await fsClient.get().readDir(this.props.origin, node.key);
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
    [filePath: string]: Awaited<ReturnType<typeof fsType.readDir>>
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
