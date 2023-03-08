import "@tabler/core/dist/css/tabler.css";
import Header from "./Header";
import React from "react";
import {createRoot} from "react-dom/client";
import {Client} from "./client";

const savedTheme = window.localStorage.getItem("theme");
if(savedTheme === "dark") document.body.classList.add("theme-dark");

const root = createRoot(document.body);

root.render(<>
    <Header />
    You are here: <code>{await Client.currentDir()}</code>
</>)
