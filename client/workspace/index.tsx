import React, {Component, ReactNode} from "react";
import WindowElement from "./Window";
import "./index.css";

export class Workspace extends Component {
    static instance: Workspace;

    state: {
        windows: {
            id: string,
            element: ReactNode
        }[]
    } = {
        windows: []
    }

    constructor(props?) {
        super(props);

        Workspace.instance = this;
    }

    addWindow(element: ReactNode){
        this.setState({
            windows: [
                ...this.state.windows,
                {
                    id: Math.floor(Math.random() * 100000).toString(),
                    element
                }
            ]
        })
    }

    render(){
        return this.state.windows.map((win) =>
            <WindowElement key={win.id} close={() => {
                this.state.windows.splice(this.state.windows.indexOf(win), 1);
                this.setState({windows: [...this.state.windows]});
            }}>{win.element}</WindowElement>);
    }
}
