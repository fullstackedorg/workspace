import {ReactElement} from "react";
import {Route, Routes, useLocation} from "react-router-dom";
import Introduction from "website/src/docs/pages/Introduction";
import {Button, Container} from "react-bootstrap";
import {faBars} from "@fortawesome/free-solid-svg-icons/faBars";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Testing from "website/src/docs/pages/Testing";
import Deploying from "website/src/docs/pages/Deploying";
import DocsNavigation from "website/src/docs/DocsNavigation";
import Creating from "./pages/Creating";
import Developing from "./pages/Developing";
import Building from "./pages/Building";
import QuickStart from "./pages/QuickStart";
import Commands from "./pages/Commands";
import DocsNextPrev from "./DocsNextPrev";

export type docPages = {[path: string]: {
    title: string,
    component: ReactElement
}};


const docsPages: docPages = {
    "/": {
        title: "Introduction",
        component: <Introduction />
    },
    "/quick-start": {
        title: "Quick Start",
        component: <QuickStart />
    },
    "/commands": {
        title: "Commands",
        component: <Commands />
    },
    "/creating": {
        title: "Creating",
        component: <Creating />
    },
    "/developing": {
        title: "Developing",
        component: <Developing />
    },
    "/building": {
        title: "Building",
        component: <Building />
    },
    "/testing": {
        title: "Testing",
        component: <Testing />
    },
    "/deploying": {
        title: "Deploying",
        component: <Deploying />
    }
}

export default function() {
    const location = useLocation();
    return <>
        <style>{`
        #docs-navigation {
            width: 300px;
            position: fixed;
            height: calc(100% - 90px);
            top: 90px;
            background-color: #d7dfe1;
        }
        @media (min-width: 960px){
            #docs-navigation {
                border-top-right-radius: 10px;
            }
        }
        #docs-navigation > .inner {
            width: 100%;
            height: 100%;
            max-width: 300px;
        }
        #docs-navigation a {
            color: black;
            text-decoration: none;
            opacity: 0.7;
        }
        #docs-navigation a.active{
            color: #05afde;
            opacity: 1;
        }
        .docs-navigation-toggle {
            background-color: #d7dfe1;
        }
        #docs-navigation a:hover{
            opacity: 1;
        }
        .docs-content {
            width: calc(100% - 300px);
            margin-left: 300px;
            display: flex;
            flex-direction: column;
        }
        .docs-navigation-toggle {
            display: none;
        }
        .docs-navigation-overlay {
            z-index: 9998;
            position: fixed;
            top: 0;
            left: 0;
            height: 100%;
            width: 100%;
            background-color: #1a1f21b0;
            display: none;
        }
        .docs-content > div {
            max-width: 800px;
            margin: 0 auto;
        }
        .docs-content h3 {
            padding-top: 90px;
            margin-top: calc(3rem - 90px);
        }
        .docs-content .box {
            padding: 1.5rem;
            margin-top: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .docs-buttons button {
            height: 100%;
            width: 100%;
        }
        @media (max-width: 960px){
            #docs-navigation {
                left: -300px;
                top: 0;
                z-index: 9999;
                height: 100%;
                transition: 0.3s left;
            }
            #docs-navigation.open{
                left: 0;
            }
            #docs-navigation.open + .docs-navigation-overlay {
                display: block;
            }
            .docs-navigation-toggle {
                display: block;
            }
            .docs-content { 
                width: 100%;
                margin-left: 0;
            }
        }
        @media (min-width: 1320px){
            #docs-navigation {
                left:0;
                right: calc(50% + 360px);
                width: auto;
                display: flex;
                justify-content: flex-end;
            }
        }
        .mark, mark {
            background-color: #01b0de;
        }
        .dropdown-menu.show > a {
            color: black!important;
        }
    `}</style>
        <div style={{width: "100%", maxWidth: 1320, margin: "0 auto"}}>
            <div id={"docs-navigation"} className={"p-4"}>
                <div className={"inner"}>
                    <div className={"mb-3"} style={{height: 38}}>
                        <Typeahead
                            id={"docs-search"}
                            placeholder={"Search"}
                            onChange={(selected) => {
                                const pageIndex = Object.values(docsPages).map(page => page.title).indexOf(selected[0] as string);
                                const path = Object.keys(docsPages)[pageIndex];
                                window.location.href = "/docs" + path;
                            }}
                            options={Object.values(docsPages).map(page => page.title)}

                        />
                    </div>
                    <div className={"mb-2"}><b>References</b></div>
                    <DocsNavigation location={location} pages={docsPages} />
                </div>
            </div>
            <div className={"docs-navigation-overlay"} onClick={() =>
                document.querySelector("#docs-navigation").classList.remove("open")}/>
            <div className={"docs-navigation-toggle mb-3"}>
                <Container className={"py-2"}>
                    <Button
                        className={"me-2"}
                        onClick={() => {
                            document.querySelector("#docs-navigation").classList.add("open");
                        }}
                    ><FontAwesomeIcon icon={faBars} /></Button>
                    <b>Navigation</b>
                </Container>
            </div>
            <div className={"docs-content"}>
                <Routes>
                    {Object.keys(docsPages).map((page, index) =>
                        <Route key={"page-"+index} path={page}
                               element={<Container><h1>{docsPages[page].title}</h1>
                                   {docsPages[page].component}
                               </Container>} />)}
                </Routes>
                <DocsNextPrev pages={docsPages} location={location} />
            </div>
        </div>
    </>
}
