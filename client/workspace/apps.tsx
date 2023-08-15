import { Component, ReactElement, ReactNode } from "react";
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
import Terminal from "../terminal";
import { Explorer } from "../app/files";
import Browser from "../browser";
import Latency from "../latency";

export type App = {
    title: string,
    icon: string,
    element: ((any) => ReactElement) | typeof Component
}

export const defaultApps: App[] = [
    {
        title: "Terminal",
        icon: terminal,
        element: Terminal
    },
    {
        title: "Explorer",
        icon: files,
        element: Explorer
    },
    {
        title: "Browser",
        icon: browser,
        element: Browser
    },
    {
        title: "Latency",
        icon: stopwatch,
        element: Latency
    }
]

