import { ReactNode } from "react";
//@ts-ignore
import browser from "../icons/browser.svg";
//@ts-ignore
import terminal from "../icons/terminal.svg";
//@ts-ignore
import files from "../icons/files.svg";
//@ts-ignore
import logo from "../icons/fullstacked-logo.svg";
//@ts-ignore
import logout from "../icons/log-out.svg";
//@ts-ignore
import codeOSS from "../icons/code-oss.svg";
//@ts-ignore
import stopwatch from "../icons/stopwatch.svg";
import React from "react";

export type App = {
    title: string,
    icon: string
}

export const defaultApps: App[] = [
    {
        title: "Terminal",
        icon: terminal
    },
    {
        title: "Explorer",
        icon: files
    },
    {
        title: "Browser",
        icon: browser
    },
    {
        title: "Latency",
        icon: stopwatch
    }
]

