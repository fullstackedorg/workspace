import React from "react";
import {copyToClipboard} from "../utils";

export default function ({verificationUri, deviceCode}) {
    return <div className={"github-auth-flow"}>
        <div>You need to authorize FullStacked to access your GitHub repos.</div>
        <div>Enter then code <b>{deviceCode}</b> at <b>{verificationUri}</b></div>
        <button onClick={() => {
            copyToClipboard(deviceCode);
            window.open(verificationUri, '_blank').focus();
        }}>Copy and Go</button>
    </div>
}
