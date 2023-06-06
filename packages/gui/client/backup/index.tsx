import NotReady from "../NotReady";
import React from "react";

export default function () {
    return <>
        <div className={"container-xl"}>
            <div className={"page-header"}>
                <h2 className={"page-title"}>Backup</h2>
            </div>
        </div>

        <NotReady command={"Backup"} />
    </>
}
