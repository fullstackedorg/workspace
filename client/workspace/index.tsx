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
    id: string,
    order: number
} & App)

export class Workspace extends Component {
    static apps: App[] = [];
    static instance: Workspace;
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

    iframeIDsToWindow = new Map<string, ActiveApp>();

    state: {
        windows: ActiveApp[],
    } = {
        windows: []
    }

    constructor(props?) {
        super(props);

        Workspace.instance = this;
        this.checkIfInIFrames();
    }

    addWindow(app: App){
        this.setState({
            windows: [
                ...this.state.windows,
                {
                    ...app,
                    id: Math.floor(Math.random() * 100000).toString(),
                    order: this.state.windows.reduce((highest, {order}) => order > highest ? order : highest, 0) + 1,
                }
            ]
        })
    }

    checkIfInIFrames(){
        window.requestAnimationFrame(this.checkIfInIFrames.bind(this));
        if(document.activeElement.tagName === "IFRAME"){
            const iframeID = document.activeElement.getAttribute("id");
            if(!iframeID) return;
            const window = this.iframeIDsToWindow.get(iframeID);
            if(!window) return;
            this.focusWindow(window);
        }
    }

    focusWindow(window: ActiveApp){
        const i = this.state.windows.map(({id}) => id).indexOf(window.id);
        if(i === this.state.windows.length) return;
        this.state.windows[i].order = this.state.windows.reduce((highest, {order}) => order > highest ? order : highest, 0) + 1;
        const idOrder = new Map<string, number>();
        [...this.state.windows]
            .sort((winA, winB) => winA.order - winB.order)
            .forEach(({id}, i) => idOrder.set(id, i + 1));
        this.setState({
            windows: this.state.windows.map(win => ({
                ...win,
                order: idOrder.get(win.id)
            }))
        });
    }

    getActiveApp(){
        return [...this.state.windows]
            .sort((winA, winB) => winB.order - winA.order);
    }

    render(){
        return <>
            {this.state.windows.map((win, i) =>
                <WindowElement
                    key={win.id}
                    close={() => {
                        this.state.windows.splice(this.state.windows.indexOf(win), 1);
                        this.setState({windows: [...this.state.windows]});
                    }}
                    initPos={Workspace.calcInitPos()}
                    zIndex={win.order}
                    didResize={() => win.callbacks?.onWindowResize && win.callbacks.onWindowResize()}
                    didFocus={() => this.focusWindow(win)}
                    hasIFrames={iframesIDs => {
                        iframesIDs.forEach(iframeID => {
                            this.iframeIDsToWindow.set(iframeID, win);
                        })
                    }}
                >
                    {win.element(win)}
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
