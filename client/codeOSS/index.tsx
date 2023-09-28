import "./index.css";
import {client} from "../client";
import CodeOSSIcon from "../icons/code-oss.svg";
import React from "react";
import AddApp from "../workspace/AddApp";
import {Workspace} from "../workspace";
import sleep from "@fullstacked/cli/utils/sleep";

const portCodeOSS = await client.get(true).portCodeOSS();
if(portCodeOSS){
    const inDocker = await client.get(true).isInDockerRuntime();
    AddApp({
        title: "Code",
        icon: CodeOSSIcon,
        order: 3,
        noWindow: true,
        element: ({id, args: {folder}}) => {
            const win = Workspace.instance.state.windows.find(window => window.id === id);
            CodeOSS.load(win, folder);

            return undefined;
        },
        args: {
            folder: await client.get(true).currentDir()
        }
    });
}

class CodeOSS {
    static loaded = false;
    static element: HTMLDivElement;
    private static async waitForElement(){
        while(!CodeOSS.element){
            CodeOSS.element = document.querySelector(".monaco-workbench");
            await sleep(100);
        }
    }
    static load({id, order}, folder) {
        if(CodeOSS.loaded){
            CodeOSS.waitForElement().then(() => {
                CodeOSS.element.style.zIndex = order.toString();
            });
            return;
        };
        CodeOSS.loaded = true;

        const parser = new DOMParser();

        fetch("/oss-dev")
            .then(res => res.text())
            .then(async htmlStr => {
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
                        script.src = element.getAttribute("src");
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
                CodeOSS.element.style.zIndex = order.toString();

                CodeOSS.element.addEventListener("click", () => {
                    Workspace.instance.focusWindow(Workspace.instance.activeApps.get(id))
                });

                url.search = ``;
                window.history.replaceState(null, null, url);
            });
    }
}
