import React, {ReactNode, useEffect, useRef, useState} from "react";

let doubleClick = 0;
export default function (props: {
    children: ReactNode,
    close(): void,
    initPos: {
        top: number,
        left: number,
        height: number,
        width: number
    },
    zIndex: number,
    didResize(): void,
    didFocus(): void,
    hasIFrames(iframesIDs: string[]): void
}) {
    const windowRef = useRef<HTMLDivElement>();
    const [showOptions, setShowOptions] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    const getClientPos = (e: MouseEvent | TouchEvent) => {
        if(e instanceof MouseEvent)
            return {x: e.clientX, y: e.clientY}
        else if(e instanceof TouchEvent)
            return {x: e.touches[0].clientX, y : e.touches[0].clientY}
        else
            throw Error("Unknown event");
    }

    const movestart = (e: MouseEvent | TouchEvent) => {
        if(Date.now() - doubleClick < 200){
            setFullscreen(!fullscreen);
            return;
        }
        doubleClick = Date.now();
        const {x, y, height, width} = windowRef.current.getBoundingClientRect();
        const initialPos = {x, y};
        const start = getClientPos(e);
        windowRef.current.classList.add("moving");
        document.body.classList.add("moving");
        const move = (e: MouseEvent | TouchEvent) => {
            const clientPos = getClientPos(e);
            let x = clientPos.x - start.x + initialPos.x;
            let y = clientPos.y - start.y + initialPos.y;

            if(x <= 0){
                x = 0;
            }else if(x >= window.innerWidth - width)
                x = window.innerWidth - width;

            if(y <= 0)
                y = 0;
            else if(y >= window.innerHeight - height)
                y = window.innerHeight - height;

            windowRef.current.style.left = x + "px";
            windowRef.current.style.top = y + "px";
        }
        window.addEventListener("mousemove", move);
        window.addEventListener("touchmove", move);
        const moveend = () => {
            windowRef.current.classList.remove("moving");
            document.body.classList.remove("moving");
            window.removeEventListener("mousemove", move);
            window.removeEventListener("touchmove", move);

            window.removeEventListener("mouseup", moveend);
            window.removeEventListener("touchend", moveend);
        }
        window.addEventListener("mouseup", moveend);
        window.addEventListener("touchend", moveend);
    }

    useEffect(() => {setTimeout(props.didResize, 350)}, [fullscreen])

    const resizestart = (e: MouseEvent | TouchEvent, resizeX: -1 | 0 | 1, resizeY: -1 | 0 | 1) => {
        const {x, y, height, width} = windowRef.current.getBoundingClientRect();
        const initialSize = {height, width}
        const start = getClientPos(e);
        windowRef.current.classList.add("resizing");
        document.body.classList.add("resizing");
        const resizeWidth = (width: number) => {
            if(resizeX === -1){
                const left = x - (width - initialSize.width);
                if(left < 0){
                    windowRef.current.style.left = "0px";
                    return;
                }
                windowRef.current.style.left = left + "px";
            }else if(x + width > window.innerWidth){
                width = window.innerWidth - x;
            }
            windowRef.current.style.width = width + "px";
        }
        const resizeHeight = (height: number) => {
            if(resizeY == -1){
                const top = y - (height - initialSize.height);
                if(top < 0){
                    windowRef.current.style.top = "0px";
                    return;
                }
                windowRef.current.style.top = top + "px";
            }else if(y + height > window.innerHeight){
                height = window.innerHeight - y;
            }
            windowRef.current.style.height = height + "px";

        }
        const resize = (e: MouseEvent | TouchEvent) => {
            const clientPos = getClientPos(e);
            let width = (clientPos.x - start.x) * resizeX + initialSize.width;
            let height = (clientPos.y - start.y) * resizeY + initialSize.height;

            if(resizeX)
                resizeWidth(width);

            if(resizeY)
                resizeHeight(height);
        }
        window.addEventListener("mousemove", resize);
        window.addEventListener("touchmove", resize);
        const resizeend = () => {
            windowRef.current.classList.remove("resizing");
            document.body.classList.remove("resizing");
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("touchmove", resize);

            window.removeEventListener("mouseup", resizeend);
            window.removeEventListener("touchend", resizeend);

            props.didResize();
        }
        window.addEventListener("mouseup", resizeend);
        window.addEventListener("touchend", resizeend);
    }

    useEffect(() => {
        const iframes = windowRef.current.querySelectorAll<HTMLIFrameElement>("iframe");
        if(!iframes.length) return;
        const iframesIDs = Array.from(iframes).map(iframe => {
            const id = makeid(6);
            iframe.setAttribute("id", id);
            return id;
        });
        props.hasIFrames(iframesIDs);
    }, []);

    return <div
        ref={windowRef}
        style={{
            ...props.initPos,
            zIndex: props.zIndex
        }}
        className={"window" + (fullscreen ? " full" : "")}
        onMouseDown={props.didFocus}
        onTouchStart={props.didFocus}
    >
        <div className="resizer">
            {new Array(8).fill(null).map((_, index) => {
                let x: -1 | 0 | 1 = 0, y: -1 | 0 | 1 = 0;
                switch(index){
                    case 0:
                        x = -1;
                        y = -1;
                        break;
                    case 1:
                        x = 0;
                        y = -1;
                        break;
                    case 2:
                        x = 1;
                        y = -1;
                        break;
                    case 3:
                        x = 1;
                        y = 0;
                        break;
                    case 4:
                        x = 1;
                        y = 1;
                        break;
                    case 5:
                        x = 0;
                        y = 1;
                        break;
                    case 6:
                        x = -1;
                        y = 1;
                        break;
                    case 7:
                        x = -1;
                        y = 0;
                        break;
                }
                let resizeBinding = e => resizestart(e.nativeEvent, x, y);
                return <div onMouseDown={resizeBinding} onTouchStart={resizeBinding} ><div /></div>})
            }
        </div>
        <div
            onMouseDown={e => movestart(e.nativeEvent)}
            onTouchStart={e => movestart(e.nativeEvent)}
        />
        <div>{props.children}</div>
        <div
            className={"options" + (showOptions ? " open" : "")}
            onMouseEnter={() => setShowOptions(true)}
            onClick={() => setShowOptions(true)}
            onMouseLeave={() => setShowOptions(false)}
        >
            <div>
                <button onClick={(e) => {
                    if(!showOptions) return;
                    e.stopPropagation();
                    setFullscreen(!fullscreen);
                    setShowOptions(false);
                }}>
                    {fullscreen
                        ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                        </svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>}
                </button>
                {/*<button>*/}
                {/*    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"*/}
                {/*         stroke="currentColor" >*/}
                {/*        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>*/}
                {/*    </svg>*/}
                {/*</button>*/}
                <button onClick={() => {
                    if(!showOptions) return;
                    props.close()
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                         stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        </div>
    </div>
}


function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }
    return result;
}
