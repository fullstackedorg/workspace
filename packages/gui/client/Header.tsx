import React from "react";
import version from "fullstacked/version";
//@ts-ignore
import logo from "./favicon.png";
import {useNavigate} from "react-router-dom";

export default function (){
    const navigate = useNavigate();

    return <header className="navbar navbar-expand-md navbar-light d-print-none">
        <div className="container-fluid">
            <div className="d-flex align-items-center">
                <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
                    <div onClick={() => navigate("/")} className={"cursor-pointer"}>
                        <img src={logo} width="32" height="32" alt="Tabler"
                             className="navbar-brand-image me-3" />
                        FullStacked GUI
                    </div>
                </h1>
                <div>
                    <small className={"text-muted"}>v{version}</small>
                </div>
            </div>
            <div className="navbar-nav flex-row order-md-last">
                <div className="nav-item d-none d-md-flex me-3">
                    <div className="btn-list">
                        <a href="https://docs.fullstacked.org" className="btn" target="_blank" rel="noreferrer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-book-2"
                                 width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                 fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M19 4v16h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12z"></path>
                                <path d="M19 16h-12a2 2 0 0 0 -2 2"></path>
                                <path d="M9 8h6"></path>
                            </svg>
                            Docs
                        </a>
                        <a href="https://github.com/cplepage/fullstacked" className="btn" target="_blank" rel="noreferrer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24"
                                 viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                 strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" />
                            </svg>
                            Source code
                        </a>
                        <a href="https://www.patreon.com/fullstacked" className="btn" target="_blank" rel="noreferrer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="icon text-pink" width="24" height="24"
                                 viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                 strokeLinecap="round" strokeLinejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428m0 0a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
                            </svg>
                            Sponsor
                        </a>
                    </div>
                </div>
                <div className="d-none d-md-flex">
                    <div style={{cursor: "pointer"}} onClick={() => {
                        window.localStorage.setItem("theme", "dark");
                        document.body.classList.add("theme-dark");
                    }} className="nav-link px-0 hide-theme-dark" data-bs-toggle="tooltip"
                         data-bs-placement="bottom" aria-label="Enable dark mode"
                         data-bs-original-title="Enable dark mode">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24"
                             viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                             strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
                        </svg>
                    </div>
                    <div style={{cursor: "pointer"}} onClick={() => {
                        window.localStorage.setItem("theme", "light");
                        document.body.classList.remove("theme-dark");
                    }} className="nav-link px-0 hide-theme-light mr-2" data-bs-toggle="tooltip"
                         data-bs-placement="bottom" aria-label="Enable light mode"
                         data-bs-original-title="Enable light mode">
                        <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="24" height="24"
                             viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                             strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <circle cx="12" cy="12" r="4"></circle>
                            <path
                                d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    </header>
}
