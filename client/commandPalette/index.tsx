import React, {Component, createRef} from "react";
import "./index.css"
import {Workspace} from "../workspace";

export default class extends Component {
    inputRef = createRef<HTMLInputElement>();
    state = {
        inputValue: "",
        show: false,
        focus: null
    }

    componentDidMount() {
        window.addEventListener("keydown", e => {
            console.log(e)
            if(e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && e.shiftKey){
                e.preventDefault();
                if(!this.state.show)
                    this.setState({show: true})

                const activeApps = Workspace.instance?.getActiveApp();
                if(activeApps && activeApps.length){
                    let nextFocusIndex = this.state.focus === null
                        ? 0
                        : activeApps.map(({id}) => id).indexOf(this.state.focus) + 1;
                    if(nextFocusIndex >= activeApps.length)
                        nextFocusIndex = 0;

                    this.setState({focus: activeApps.at(nextFocusIndex).id})
                }
            }else if(e.key === "Escape" && document.querySelector("#command-palette")) {
                this.setState({show: false})
            }
        })
        window.addEventListener("keyup", e => {
            if(!this.state.focus) return;
            if(e.shiftKey || (e.metaKey || e.ctrlKey)) return;
            const activeApps = Workspace.instance.getActiveApp();
            if(!activeApps?.length || activeApps.length < 2) return;
            const appIndex = activeApps.map(({id}) => id).indexOf(this.state.focus);
            console.log(appIndex);
            if(appIndex === 0) return;
            Workspace.instance.focusWindow(activeApps.find(({id}) => this.state.focus === id));
            this.setState({show: false})
        })
    }

    componentDidUpdate(prevProps: Readonly<{}>, prevState, snapshot?: any) {
        if(!prevState.show && this.state.show)
            this.inputRef.current.focus();
        else if(prevState.show && !this.state.show)
            this.setState({focus: null});
    }

    render(){
        const activeApps = Workspace.instance ? Workspace.instance.getActiveApp() : [];
        const filteredApps = Workspace.instance
            ? (activeApps.length && !this.state.inputValue)
                ? activeApps
                : Workspace.apps.filter(app =>
                    this.state.inputValue
                        ? app.title.toLowerCase().startsWith(this.state.inputValue)
                        : true).map(app => ({...app, id: undefined}))
            : [];

        const submit = e => {
            e.preventDefault();

            if(this.state.focus && !this.state.inputValue){
                Workspace.instance.focusWindow(Workspace.instance.getActiveApp().find(({id}) => id === this.state.focus));
            }else{
                const app = filteredApps.at(0);
                if(!app) return;
                Workspace.instance.addWindow(app);
            }

            this.setState({
                show: false,
                inputValue: ""
            });
        }

        return <div id={"command-palette"} style={{display: this.state.show ? "flex" : "none"}}>
            <div onClick={() => this.setState({show: false})} />
            <div>
                <form onSubmit={submit}
                      style={!this.state.inputValue ? {opacity: 0, height: 0} : {}}>
                    <input ref={this.inputRef} value={this.state.inputValue}
                           onChange={e => this.setState({inputValue: e.currentTarget.value})} />
                </form>
                <div className="apps">{filteredApps.map((app, i) =>
                    <div
                        className={app.id === this.state.focus ? "focus" : ""}
                        onClick={() => {
                            this.setState({
                                show: false,
                                inputValue: ""
                            });
                            Workspace.instance.addWindow(app);
                        }}
                    >
                        <img src={app.icon} />
                        <div>{app.title}</div>
                    </div>)}
                </div>
            </div>
        </div>
    }

}
