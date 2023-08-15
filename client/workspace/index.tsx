import React, {Component, ReactNode} from "react";
import WindowElement from "./Window";
import "./index.css";
import { App, defaultApps } from "./apps";

export class Workspace extends Component {
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

    state: {
        windows: ({
            id: string
        } & App)[],
        apps: App[],
    } = {
        windows: [],
        apps: defaultApps
    }

    constructor(props?) {
        super(props);

        Workspace.instance = this;
    }

    addWindow(app: App){
        this.setState({
            windows: [
                ...this.state.windows,
                {
                    id: Math.floor(Math.random() * 100000).toString(),
                    ...app
                }
            ]
        })
    }

    render(){
        return this.state.windows.map((win, i) =>
            <WindowElement key={win.id} close={() => {
                this.state.windows.splice(this.state.windows.indexOf(win), 1);
                this.setState({windows: [...this.state.windows]});
            }} initPos={Workspace.calcInitPos()}><win.element /></WindowElement>);
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