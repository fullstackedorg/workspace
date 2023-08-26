import React, {Component, ReactNode} from "react";
import WindowElement from "./Window";
import "./index.css";

type App = {
    title: string,
    icon: string,
    element: (app: App) => ReactNode,
    callbacks?: {
        onWindowResize?(): void,
        onFocus?(): void
    }
}

type ActiveApp = ({
    id: string
} & App)

export class Workspace extends Component {
    static apps: (App & {order: number})[] = [];
    static instance: Workspace;

    private topActiveApp: ActiveApp;
    private static calcInitPos = () => {
        const width = getDefaultWidth();
        const height = getDefaultHeight(width);
        return {
            width,
            height,
            left: window.innerWidth / 2 - width / 2,
            top: window.innerHeight / 2 - height / 2
        }
    }

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
        this.checkIfInIFrames();
    }

    addWindow(app: App){
        const id = Math.floor(Math.random() * 100000).toString();

        (app as ActiveApp).id = id;
        this.activeApps.set(id, (app as ActiveApp));

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

    }

    lastActiveElement;
    checkIfInIFrames(){
        window.requestAnimationFrame(this.checkIfInIFrames.bind(this));
        if(document.activeElement.tagName === "IFRAME" && document.activeElement !== this.lastActiveElement){
            console.log("ICICIIC")
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

        const i = this.state.windows.map(({id}) => id).indexOf(window.id);
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
            {this.state.windows.map(({id, order}, i) =>
                <WindowElement
                    key={id}
                    close={() => {
                        this.state.windows.splice(i, 1);
                        this.setState({windows: [...this.state.windows]});
                    }}
                    initPos={Workspace.calcInitPos()}
                    zIndex={order}
                    didResize={() => {
                        const activeApp = this.activeApps.get(id);
                        if(activeApp?.callbacks?.onWindowResize)
                            activeApp.callbacks.onWindowResize();
                    }}
                    didFocus={() => this.focusWindow(this.activeApps.get(id))}
                    hasIFrames={iframesIDs => {
                        iframesIDs.forEach(iframeID => {
                            this.iframeIDsToWindow.set(iframeID, this.activeApps.get(id));
                        })
                    }}
                >
                    {this.activeApps.get(id).element(this.activeApps.get(id))}
                </WindowElement>)}
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
