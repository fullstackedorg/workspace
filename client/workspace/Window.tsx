import React, {useRef, useState} from "react";

export default function ({children, close}) {
    const windowRef = useRef<HTMLDivElement>();
    const [showOptions, setShowOptions] = useState(false);



    const mousedown = (e) => {
        const {x, y} = windowRef.current.getBoundingClientRect();
        const initialPos = {x, y}
        const startMouse = {x: e.clientX, y: e.clientY};
        const mousemove = (e) => {
            const x = e.clientX - startMouse.x + initialPos.x;
            const y = e.clientY - startMouse.y + initialPos.y;
            windowRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
            // windowRef.current.style.left = x + "px";
            // windowRef.current.style.top = y + "px";
        }
        window.addEventListener("mousemove", mousemove);
        const mouseup = () => {
            window.removeEventListener("mousemove", mousemove);
            window.removeEventListener("mouseup", mouseup);
        }
        window.addEventListener("mouseup", mouseup);
    }


    return <div ref={windowRef} className={"window"}>
        <div onMouseDown={mousedown} />
        <div>{children}</div>
        <div className={"options"}>
            <svg onClick={() => setShowOptions(true)} onMouseOver={() => setShowOptions(true)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 64">
                <circle cx="32" cy="32" r="32"/>
                <circle cx="130" cy="32" r="32"/>
                <circle cx="228" cy="32" r="32"/>
            </svg>
            {showOptions && <div className={"button-group"}>
                <button onClick={() => {}}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                </button>
                <button>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                         stroke="currentColor" >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/>
                    </svg>
                </button>
                <button onClick={close}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
                         stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>}
        </div>
    </div>
}
