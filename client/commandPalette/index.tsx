import React, {Component, createRef} from "react";
import "./index.css"
import {Workspace} from "../workspace";

export default class CommandPalette extends Component {
    static instance: CommandPalette;
    inputRef = createRef<HTMLInputElement>();
    state = {
        inputValue: "",
        show: false,
        focus: null
    }

    constructor(props) {
        super(props);

        CommandPalette.instance = this;
    }

    open(){
        if(!this.state.show)
            this.setState({show: true})

        const activeApps = Workspace.instance?.getActiveApp();
        if(activeApps && activeApps.length){
            let nextFocusIndex = this.state.focus === null
                ? 0
                : activeApps.map(({id}) => id).indexOf(this.state.focus) + 1;
            if(nextFocusIndex >= activeApps.length)
                nextFocusIndex = 0;

            const nextActiveApp = activeApps.at(nextFocusIndex);
            this.setState({focus: nextActiveApp.id});
        }
    }

    componentDidMount() {
        window.addEventListener("keydown", e => {
            if(e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && e.shiftKey){
                e.preventDefault();
                this.open();
            }else if(e.key === "Escape" && this.state.show) {
                this.setState({show: false})
            }
        })
        window.addEventListener("keyup", e => {
            if(!this.state.focus) return;
            if(e.shiftKey || (e.metaKey || e.ctrlKey)) return;
            const activeApps = Workspace.instance.getActiveApp();
            if(!activeApps?.length || activeApps.length < 2) return;
            const appIndex = activeApps.map(({id}) => id).indexOf(this.state.focus);
            if(appIndex === 0) return;
            const nextActiveApp = activeApps.find(({id}) => this.state.focus === id);
            Workspace.instance.focusWindow(nextActiveApp);
            this.setState({show: false})
        })
    }

    componentDidUpdate(prevProps: Readonly<{}>, prevState, snapshot?: any) {
        if(!prevState.show && this.state.show)
            this.inputRef.current.focus();
        else if(prevState.show && !this.state.show)
            this.setState({focus: null});
    }

    triggerRef = createRef<HTMLDivElement>();
    triggerBB;
    initCursor;
    deltaMovement = 0;
    getPos = (e: TouchEvent | MouseEvent) => {
        if(e instanceof MouseEvent)
            return {x: e.clientX, y: e.clientY};
        else
            return {x: e.touches[0].clientX, y: e.touches[0].clientY};
    }
    start = (e: TouchEvent | MouseEvent) => {
        this.triggerBB = this.triggerRef.current.getBoundingClientRect();
        this.initCursor = this.getPos(e);
        window.addEventListener("touchmove", this.move);
        window.addEventListener("mousemove", this.move);
        window.addEventListener("touchend", this.end);
        window.addEventListener("mouseup", this.end);
        document.querySelector<HTMLDivElement>("#command-palette-trigger-move").style.display = "block";
    }
    move = (e: TouchEvent | MouseEvent) => {
        const currentPos = this.getPos(e);
        const deltaX = currentPos.x - this.initCursor.x;
        const deltaY = currentPos.y - this.initCursor.y;

        this.deltaMovement = Math.max(Math.abs(deltaX), Math.abs(deltaY));

        let posX = this.triggerBB.x + deltaX;
        if(posX + this.triggerBB.width >= window.innerWidth)
            posX = window.innerWidth - this.triggerBB.width;
        else if(posX <= 0)
            posX = 0;

        let posY = this.triggerBB.y + deltaY;
        if(posY + this.triggerBB.height >= window.innerHeight)
            posY = window.innerHeight - this.triggerBB.height;
        else if(posY <= 0)
            posY = 0;

        this.triggerRef.current.style.left = posX / window.innerWidth * 100 + "%";
        this.triggerRef.current.style.top = posY / window.innerHeight * 100 + "%";
    }
    end = () => {
        window.removeEventListener("touchmove", this.move);
        window.removeEventListener("mousemove", this.move);
        window.removeEventListener("touchend", this.end);
        window.removeEventListener("mouseup", this.end);
        document.querySelector<HTMLDivElement>("#command-palette-trigger-move").style.display = "none";
        if(this.deltaMovement < 1){
            this.setState({show: true});
        }
        this.deltaMovement = 0;
    }


    render(){
        const filter = app => this.state.inputValue
            ? app.title.toLowerCase().startsWith(this.state.inputValue)
            : true

        const activeApps = (Workspace.instance ? Workspace.instance.getActiveApp() : []).filter(filter);
        const filteredApps = Workspace.apps.filter(filter).sort((appA, appB) => appA.order - appB.order);

        const submit = e => {
            e.preventDefault();

            if (this.state.focus && !this.state.inputValue) {
                Workspace.instance.focusWindow(Workspace.instance.getActiveApp().find(({id}) => id === this.state.focus));
            } else {
                const app = filteredApps.at(0);
                if (!app) return;
                Workspace.instance.addWindow(app);
            }

            this.setState({
                show: false,
                inputValue: ""
            });
        }

        return <>
            <div id={"command-palette-trigger"}
                 ref={this.triggerRef}
                 style={{display: this.state.show ? "none" : "block"}}
                 onMouseDown={e => this.start(e.nativeEvent)}
                 onTouchStart={e => this.start(e.nativeEvent)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
                </svg>
            </div>
            <div id={"command-palette-trigger-move"} style={{display: "none"}} />

            <div id={"command-palette"} style={{display: this.state.show ? "flex" : "none"}}>
                <div onClick={() => this.setState({show: false})} />
                <div>
                    <form onSubmit={submit}
                          style={!this.state.inputValue ? {opacity: 0, height: 0} : {}}>
                        <input ref={this.inputRef} value={this.state.inputValue}
                               onChange={e => this.setState({inputValue: e.currentTarget.value})} />
                    </form>
                    {!!activeApps.length && <>
                        <div className={"subtitle"}>Opened</div>
                        <div className={"apps"}>
                            {activeApps.map(app => <div
                                className={app.id === this.state.focus ? "focus" : ""}
                                onClick={() => {
                                    this.setState({
                                        show: false,
                                        inputValue: ""
                                    });
                                    Workspace.instance.focusWindow(app)
                                }}
                            >
                                <img src={app.icon} />
                                <div>{app.title}</div>
                            </div>)}
                        </div>
                    </>}
                    {!!activeApps.length && <div className={"subtitle"}>All</div>}
                    <div className="apps">
                        {filteredApps.map((app, i) => <div
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
        </>
    }

}
