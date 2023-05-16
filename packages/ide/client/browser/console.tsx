import React, {Component, createRef, RefObject} from "react";

export default class extends Component<{iframeRef: RefObject<HTMLIFrameElement>}>{
    state = {
        show: false
    }
    resizeStart: {
        cursor: number,
        height: number
    } = null;

    consoleRef = createRef<HTMLDivElement>();
    logsRef = createRef<HTMLPreElement>();

    constructor(props) {
        super(props);

        const catchIframeLog = () => {
            const logsRef = this.logsRef;
            const contentWindow = this.props?.iframeRef?.current?.contentWindow as typeof window;
            if(contentWindow?.console) {
                contentWindow.console.log = function (...args) {
                    logsRef.current.innerHTML += `<div><div>${args.map(arg => JSON.stringify(arg, null, 2)).join("</div><div>")}</div></div>`;
                    logsRef.current.scroll(0, logsRef.current.scrollHeight);
                }
                contentWindow.onerror = function () {
                    logsRef.current.innerHTML += `<div class="error"><div>${JSON.stringify(arguments, null, 2)}</div></div>`;
                    logsRef.current.scroll(0, logsRef.current.scrollHeight);
                }
            }
            window.requestAnimationFrame(catchIframeLog)
        }
        catchIframeLog();
    }

    componentDidUpdate(prevProps: Readonly<{ iframeRef: React.RefObject<HTMLIFrameElement> }>, prevState: Readonly<{show: boolean}>, snapshot?: any) {
        if(prevState.show && !this.state.show){
            this.consoleRef.current.style.height = null;
        }
    }

    resizeMouseDown = (e) => {
        this.resizeStart = {
            cursor: e.clientY || e.touches[0].clientY,
            height: this.consoleRef.current.getBoundingClientRect().height
        };
        const contentWindow = this.props?.iframeRef?.current?.contentWindow as typeof window;
        if(contentWindow) {
            contentWindow.addEventListener("mousemove", this.resizeMouseMove);
            contentWindow.addEventListener("mouseup", this.resizeMouseUp);
            contentWindow.addEventListener("touchmove", this.resizeMouseMove);
            contentWindow.addEventListener("touchend", this.resizeMouseUp);
        }
        window.addEventListener("mousemove", this.resizeMouseMove);
        window.addEventListener("mouseup", this.resizeMouseUp);
        window.addEventListener("touchmove", this.resizeMouseMove);
        window.addEventListener("touchend", this.resizeMouseUp);
    }
    resizeMouseMove = (e) => {
        if(this.resizeStart === null) return;
        const posY = e.clientY || e.touches[0].clientY
        const delta = this.resizeStart.cursor - posY;
        this.consoleRef.current.style.height = this.resizeStart.height + delta + "px";
    }
    resizeMouseUp = () => {
        this.resizeStart = null;
        const contentWindow = this.props?.iframeRef?.current?.contentWindow as typeof window;
        if(contentWindow) {
            contentWindow.removeEventListener("mousemove", this.resizeMouseMove);
            contentWindow.removeEventListener("mouseup", this.resizeMouseUp);
            contentWindow.removeEventListener("touchmove", this.resizeMouseMove);
            contentWindow.removeEventListener("touchend", this.resizeMouseUp);

        }
        window.removeEventListener("mousemove", this.resizeMouseMove);
        window.removeEventListener("mouseup", this.resizeMouseUp);
        window.removeEventListener("touchmove", this.resizeMouseMove);
        window.removeEventListener("touchend", this.resizeMouseUp);
    }

    render(){
        return <div ref={this.consoleRef} className={"console " + (this.state.show ? "open" : "")}>
            <div className={"top-bar"}
                 onMouseDown={this.resizeMouseDown}
                 onTouchStart={this.resizeMouseDown}
            >
                <button onClick={() => this.logsRef.current.innerHTML = ""}>Clear</button>
            </div>
            <pre ref={this.logsRef} />
        </div>
    }
}
