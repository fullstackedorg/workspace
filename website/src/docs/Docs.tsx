import {createRef} from "react";
import {Route, Routes, useLocation} from "react-router-dom";
import {Button, Container} from "react-bootstrap";
import {faBars} from "@fortawesome/free-solid-svg-icons/faBars";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import DocsNavigation from "website/src/docs/DocsNavigation";
import DocsNextPrev from "./DocsNextPrev";
import DocsMarkdownRenderer from "./DocsMarkdownRenderer";

export type docPages = {[path: string]: {
    title: string,
    file: string
}};


const docsPages: docPages = {
    "/": {
        title: "Introduction",
        file: require("./pages/Introduction.md")
    },
    "/requirements": {
        title: "Requirements",
        file: require("./pages/Requirements.md")
    },
    "/quick-start": {
        title: "Quick Start",
        file: require("./pages/QuickStart.md")
    },
    "/commands": {
        title: "Commands",
        file: require("./pages/Commands.md")
    },
    "/creating": {
        title: "Creating",
        file: require("./pages/Creating.md")
    },
    "/building": {
        title: "Building",
        file: require("./pages/Building.md")
    },
    "/running": {
        title: "Running",
        file: require("./pages/Running.md")
    },
    "/watching": {
        title: "Watching",
        file: require("./pages/Watching.md")
    },
    "/testing": {
        title: "Testing",
        file: require("./pages/Testing.md")
    },
    "/deploying": {
        title: "Deploying",
        file: require("./pages/Deploying.md")
    }
}

export default function() {
    const location = useLocation();
    const navigationRef = createRef<DocsNavigation>();
    return <>
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
                    <DocsNavigation ref={navigationRef}
                                    location={location}
                                    pages={docsPages} />
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
                               element={<DocsMarkdownRenderer
                                   mdFile={docsPages[page].file}
                                   didUpdateContent={() => {
                                       if(navigationRef.current)
                                           navigationRef.current.checkForSections();
                                   }}
                               />}
                        />)}
                </Routes>
                <DocsNextPrev pages={docsPages} location={location} />
            </div>
        </div>
    </>
}
