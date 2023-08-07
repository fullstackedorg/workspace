import React, {useState} from "react";

export default function ({children, close}) {
    const [showOptions, setShowOptions] = useState(false);

    return <div className={"window"}>
        <div>
            {children}
        </div>
        <div className={"options"}>
            <svg onClick={() => setShowOptions(true)} onMouseOver={() => setShowOptions(true)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 64">
                <circle cx="32" cy="32" r="32"/>
                <circle cx="130" cy="32" r="32"/>
                <circle cx="228" cy="32" r="32"/>
            </svg>
            {showOptions && <div className={"button-group"}>
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
