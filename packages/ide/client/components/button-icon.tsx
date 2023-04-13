import React from "react";

export default function (props: {icon: string, title: string, onClick?: () => void}) {
    return <div className={"button-icon"} onClick={props.onClick}>
        <div style={{backgroundImage: `url(${props.icon})`}} />
        <div>{props.title}</div>
    </div>
}
