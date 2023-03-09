import "@tabler/core/dist/css/tabler.css";
import Header from "./Header";
import React from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Deploy from "./deploy";
import Dashboard from "./dashboard";

const savedTheme = window.localStorage.getItem("theme");
if(savedTheme === "dark") document.body.classList.add("theme-dark");

const div = document.createElement("div");
document.body.append(div);
const root = createRoot(div);

root.render(<BrowserRouter>
    <Header />
    <div className={"page-wrapper"}>
        <Routes>
            <Route path={"/deploy/*"} element={<Deploy />} />
            <Route path={"/"} element={<Dashboard />} />
        </Routes>
    </div>
</BrowserRouter>)
