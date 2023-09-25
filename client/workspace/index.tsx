import React, {Component} from "react";
import WindowElement from "./Window";
import "./index.css";
import {App} from "./App";

type ActiveApp = ({
    id: string
} & App)

export class Workspace extends Component {
    static apps: App[] = [];
    static instance: Workspace;

    private topActiveApp: ActiveApp;
    private static calcInitPos = () => {
        const width = getDefaultWidth();
        const height = getDefaultHeight(width);
        return {
            width: width / window.innerWidth * 100 + "%",
            height: height / window.innerHeight * 100 + "%",
            left: (window.innerWidth / 2 - width / 2) / window.innerWidth * 100 + "%",
            top: (window.innerHeight / 2 - height / 2) / window.innerHeight * 100 + "%"
        }
    }

    workspaceDidUpdate = new Set<() => void>();
    activeApps = new Map<string, ActiveApp>();
    iframeIDsToWindow = new Map<string, ActiveApp>();

    state: {
        windows: {
            id: string,
            order: number
        }[],
    } = {
        windows: []
    }

    constructor(props?) {
        super(props);

        Workspace.instance = this;
        (window as any).Workspace = Workspace;
        this.checkIfInIFrames();
    }

    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any) {
        this.workspaceDidUpdate.forEach(listener => listener());
    }

    addWindow(app: App){
        const id = Math.floor(Math.random() * 100000).toString();

        (app as ActiveApp).id = id;
        this.activeApps.set(id, {
            ...app,
            id
        });

        const order = this.state.windows.reduce((highest, {order}) => order > highest ? order : highest, 0) + 1;

        this.setState({
            windows: [
                ...this.state.windows,
                {
                    id,
                    order,
                }
            ]
        }, () => {this.focusWindow((app as ActiveApp))});

        return id;
    }

    removeWindow(activeApp: ActiveApp){
        const index = this.state.windows.findIndex(window => window.id === activeApp.id);
        this.state.windows.splice(index, 1);
        if (activeApp?.callbacks?.onClose)
            activeApp.callbacks.onClose();
        this.setState({windows: [...this.state.windows]});
    }

    lastActiveElement;
    checkIfInIFrames(){
        window.requestAnimationFrame(this.checkIfInIFrames.bind(this));
        if(document.activeElement.tagName === "IFRAME" && document.activeElement !== this.lastActiveElement){
            const iframeID = document.activeElement.getAttribute("id");
            if(!iframeID) return;
            const window = this.iframeIDsToWindow.get(iframeID);
            if(!window) return;
            if(window.id !== this.topActiveApp?.id)
                this.focusWindow(window);
            else if(window.callbacks?.onFocus)
                window.callbacks.onFocus();
        }
        this.lastActiveElement = document.activeElement;
    }

    focusWindow(window: ActiveApp){
        if(window.id === this.topActiveApp?.id) return;

        const i = this.state.windows.findIndex(({id}) => id === window.id);
        if(i < 0) return;

        this.state.windows[i].order = this.state.windows.reduce((highest, {order}) => order > highest ? order : highest, 0) + 1;
        const idOrder = new Map<string, number>();
        [...this.state.windows]
            .sort((winA, winB) => winA.order - winB.order)
            .forEach(({id}, i) => idOrder.set(id, i + 1));
        this.topActiveApp = window;
        this.setState({
            windows: this.state.windows.map(win => ({
                ...win,
                order: idOrder.get(win.id)
            }))
        }, () => {
            const activeApp = this.activeApps.get(window.id);
            if(activeApp?.callbacks?.onFocus)
                activeApp.callbacks.onFocus();
        });
    }

    getActiveApp(){
        return [...this.state.windows]
            .sort((winA, winB) => winB.order - winA.order)
            .map(({id}) => this.activeApps.get(id));
    }

    render(){
        return <>
            {this.state.windows.map(({id, order}, i) => {
                const app = this.activeApps.get(id);
                return <WindowElement
                    key={id}
                    close={() => {
                        this.removeWindow(app);
                    }}
                    initPos={Workspace.calcInitPos()}
                    zIndex={order}
                    didResize={() => {
                        if (app?.callbacks?.onWindowResize)
                            app.callbacks.onWindowResize();
                    }}
                    didFocus={() => this.focusWindow(app)}
                    hasIFrames={iframesIDs => {
                        iframesIDs.forEach(iframeID => {
                            this.iframeIDsToWindow.set(iframeID, this.activeApps.get(id));
                        })
                    }}
                >
                    {app.element(app)}
                </WindowElement>
            })}
            <div id={"move-overlay"} />
        </>;
    }
}


const aimedWidth = 600;
export const getDefaultWidth = () => {
    return window.innerWidth <= aimedWidth
        ? window.innerWidth
        : aimedWidth
}

const ratio = 1.4;
export const getDefaultHeight = (width: number) => {
    const ratioHeight = width / ratio;
    return window.innerHeight <= ratioHeight
        ? window.innerHeight
        : ratioHeight;
}
