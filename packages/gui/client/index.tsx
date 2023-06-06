import "@tabler/core/dist/css/tabler.css";
import Header from "./Header";
import React from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Deploy from "./deploy";
import Dashboard from "./dashboard";
import Build from "./build";
import Run from "./run";
import Watch from "./watch";
import Backup from "./backup";
import Console from "./Console";
import Create from "./create";
import "./index.css";

const savedTheme = window.localStorage.getItem("theme");
if(savedTheme === "dark") document.body.classList.add("theme-dark");

const div = document.createElement("div");
document.body.append(div);
const root = createRoot(div);

root.render(<BrowserRouter>
    <Header />

    <div className={"page-wrapper"}>
        <div className={"main-view d-flex"}>
            <div>
                <Routes>
                    <Route path={"/deploy/*"} element={<Deploy />} />
                    <Route path={"/create/*"} element={<Create />} />
                    <Route path={"/build/*"} element={<Build />} />
                    <Route path={"/run/*"} element={<Run />} />
                    <Route path={"/watch/*"} element={<Watch />} />
                    <Route path={"/backup/*"} element={<Backup />} />
                    <Route path={"/"} element={<Dashboard />} />
                </Routes>
            </div>
            <div>
                <Console />
            </div>
        </div>
    </div>
</BrowserRouter>)
