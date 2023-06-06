import React from "react";
import NotReady from "../NotReady";

export default function () {
    return <>
        <div className={"container-xl"}>
            <div className={"page-header"}>
                <h2 className={"page-title"}>Build</h2>
            </div>
        </div>

        <NotReady command={"Build"} />
    </>
}
