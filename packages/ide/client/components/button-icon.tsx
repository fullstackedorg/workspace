import React from "react";

export default function (props: {icon: string, top: number, left: number, title: string, onClick?: () => void}) {
    return <div className={"button-icon"} style={{top: props.top, left: props.left}} onClick={props.onClick}>
        <div style={{backgroundImage: `url(${props.icon})`}} />
        <div>{props.title}</div>
    </div>
}

