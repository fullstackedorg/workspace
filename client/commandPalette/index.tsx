import React, {useEffect, useRef} from "react";
import "./index.css"

export default function ({close}) {
    const inputRef = useRef<HTMLInputElement>()
    useEffect(() => {inputRef.current.focus()}, []);

    return <div id={"command-palette"}>
        <div onClick={close} />
        <div>
            <input ref={inputRef} />
        </div>
    </div>
}
