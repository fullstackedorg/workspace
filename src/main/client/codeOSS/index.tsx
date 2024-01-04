import "./index.css";
import {client} from "../client";
import CodeOSSIcon from "../icons/code-oss.svg";
import React from "react";
import {Workspace} from "../workspace";
import sleep from "@fullstacked/cli/utils/sleep";
import {createRoot} from "react-dom/client";
import {OptionButtons} from "../workspace/Window";


class CodeOSS {
    static loaded = false;
    static element: HTMLDivElement;
    static folder: string;
    static windowId: string;

    private static async waitForElement(){
        while(!CodeOSS.element){
            CodeOSS.element = document.querySelector(".monaco-workbench");
            await sleep(100);
        }
    }
    
    static async load(id, zIndex, folder) {
        if(folder && CodeOSS.folder && folder !== CodeOSS.folder){
            window.location.href = window.location.href + `?folder=${folder}`;
            return;
        }

        CodeOSS.windowId = id;
        CodeOSS.folder = folder;

        if(Workspace.instance?.apps)
            Workspace.instance.apps.find(app => app.title === "Code").args.folder = folder;

        if(CodeOSS.loaded){
            CodeOSS.waitForElement().then(() => {
                CodeOSS.element.style.zIndex = zIndex.toString();
                CodeOSS.element.style.display = "block";
            });
            return;
        }

        CodeOSS.loaded = true;

        const parser = new DOMParser();

        const response = await fetch("/oss-dev")
        const htmlStr = await response.text();

        const url = new URL(window.location.href);
        url.search = `folder=${folder}`;
        window.history.replaceState(null, null, url);

        const html = parser.parseFromString(htmlStr, "text/html");
        const head = html.head;
        head.querySelectorAll(":scope > *").forEach(element => {
            if(element.getAttribute("rel") === "icon") return;
            document.head.append(element)
        })
        const body = html.body;
        const elements = Array.from(body.querySelectorAll(":scope > *"))
        for(const element of elements){
            if(element.tagName !== "SCRIPT") return;

            const script = document.createElement("script");

            if(element.getAttribute("src")) {
                script.src = element.getAttribute("src") + "?v=" + process.env.VERSION + "-" + process.env.HASH ;
                await new Promise(resolve => {
                    script.onload = resolve;
                    document.body.append(script);
                })
            }else {
                script.textContent = element.textContent;
                document.body.append(script);
            }
        }

        await CodeOSS.waitForElement();

        document.querySelector("#root").append(CodeOSS.element);
        CodeOSS.element.style.zIndex = zIndex.toString();

        CodeOSS.element.addEventListener("click", () => {
            Workspace.instance.focusWindow(Workspace.instance.activeApps.get(CodeOSS.windowId))
        });

        url.search = ``;
        window.history.replaceState(null, null, url);

        const optionButtonsContainer = document.createElement("div");
        optionButtonsContainer.classList.add("code-oss-window-options")
        CodeOSS.element.append(optionButtonsContainer);
        createRoot(optionButtonsContainer).render(<OptionButtons buttons={[
            {
                onClick: () => {
                    CodeOSS.element.style.display = "none";
                    Workspace.instance.removeWindow(Workspace.instance.activeApps.get(CodeOSS.windowId));
                },
                icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                           stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            },
        ]} />);
    }
}

const codeOSSAvailable = await client.get(true).hasCodeOSS();
if(codeOSSAvailable) {
    const mainDir = await client.get(true).directory.main(); 
    Workspace.addApp({
        title: "Code",
        icon: CodeOSSIcon,
        order: 20,
        element: ({id, args: { folder }}) => {
            const {zIndex} = Workspace.instance.state.windows.find(win => win.id === id);
            CodeOSS.load(id, zIndex, folder);
            return <div className={"code-oss-loading"}>
                <div>Opening</div>
                <code>{folder}</code>
                <div>in CodeOSS...</div>
            </div>;
        },
        args: {
            folder: mainDir.dir.split(mainDir.sep).join("/")
        }
    });

    Workspace.onReady(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const folder = searchParams.get("folder");
        if (folder) {
            const url = new URL(window.location.href);
            url.search = "";
            window.history.replaceState(null, null, url.toString());
            Workspace.instance.addWindow({
                ...Workspace.instance.apps.find(app => app.title === "Code"),
                args: {
                    folder
                }
            })
        }
    })
}
