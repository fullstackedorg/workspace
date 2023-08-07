import React, {Component, ReactNode} from "react";
import WindowElement from "./Window";
import "./index.css";
import Editor from "../editor";

export class Workspace extends Component {
    static instance;

    state: {
        windows: {
            id: string,
            element: ReactNode
        }[]
    } = {
        windows: [{
            id: Math.floor(Math.random() * 10000).toString(),
            element: <Editor filename={"./index.js"} />
        }]
    }

    constructor(props?) {
        super(props);

        Workspace.instance = this;
    }

    render(){
        return this.state.windows.map((win) =>
            <WindowElement key={win.id} close={() => {
                this.state.windows.splice(this.state.windows.indexOf(win), 1);
                this.setState({windows: [...this.state.windows]});
            }}>{win.element}</WindowElement>);
    }
}
