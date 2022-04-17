import {Component, createRef, ReactElement} from "react";
import {NavLink, Route, Routes} from "react-router-dom";
import Introduction from "website/src/docs/pages/Introduction";
import GettingStarted from "website/src/docs/pages/GettingStarted";
import {Button, Container} from "react-bootstrap";
import {faBars} from "@fortawesome/free-solid-svg-icons/faBars";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DefaultFiles from "website/src/docs/pages/DefaultFiles";
import {faAngleRight} from "@fortawesome/free-solid-svg-icons/faAngleRight";
import {faAngleLeft} from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { Typeahead } from 'react-bootstrap-typeahead';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import Testing from "website/src/docs/pages/Testing";
import Deploying from "website/src/docs/pages/Deploying";
import DocsNavigation from "website/src/docs/DocsNavigation";

export type docPages = {[path: string]: {
    title: string,
    component: ReactElement
}};


const docsPages: docPages = {
    "/": {
        title: "Introduction",
        component: <Introduction />
    },
    "/getting-started": {
        title: "Getting Started",
        component: <GettingStarted />
    },
    "/default-files": {
        title: "Default Files",
        component: <DefaultFiles />
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

export default class extends Component {
    navigationRef = createRef<DocsNavigation>();

    componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any) {
        window.scrollTo({top: 0, left: 0, behavior: "smooth"});
        this.updateNavigation();
    }

    componentDidMount() {
        window.scrollTo({top: 0, left: 0, behavior: "smooth"});
        this.updateNavigation();
    }

    updateNavigation() {
        this.navigationRef.current.setState({
            sections: Array.from(document.querySelectorAll("h3")).map(sectionTitle => {
                const title = sectionTitle.innerText;
                sectionTitle.setAttribute("id", title.toLowerCase().replace(/ /g, "-"));
                return title;
            })
        });
    }

    render(){
        let activeIndex = 0;
        Object.keys(docsPages).forEach((page, index) => {
            const path = "/docs" + page;
            const isActive = window.location.pathname === path || window.location.pathname === path.slice(0, -1) ||
                window.location.pathname.slice(0, -1) === path;
            if(isActive)
                activeIndex = index;
        });
        return <>
            <style>{`
            #docs-navigation {
                width: 300px;
                position: fixed;
                height: calc(100% - 90px);
                top: 90px;
                background-color: #d7dfe1;
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
            @media (min-width: 1400px){
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
                        <DocsNavigation
                            ref={this.navigationRef}
                            pages={docsPages}
                            active={activeIndex}
                            didNavigate={this.forceUpdate.bind(this)}
                        />
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
                    <Container className={"my-4 docs-buttons d-flex justify-content-between"} style={{
                        width: "100%",
                        height: 70
                    }}>
                        <div style={{width: "49%"}}>
                            {activeIndex !== 0 ?
                                <NavLink
                                    to={"/docs" + Object.keys(docsPages)[activeIndex - 1]}
                                    onClick={() => {
                                        this.forceUpdate();
                                    }}
                                    style={{height: "100%", width: "100%"}}
                                ><Button variant={"secondary"}>
                                    <FontAwesomeIcon icon={faAngleLeft} /> {Object.values(docsPages)[activeIndex - 1].title}
                                </Button></NavLink> : <></>}
                        </div>
                        <div style={{width: "49%"}}>
                            {activeIndex !== Object.keys(docsPages).length - 1 ?
                                <NavLink
                                    to={"/docs" + Object.keys(docsPages)[activeIndex + 1]}
                                    onClick={() => {
                                        this.forceUpdate();
                                    }}
                                    style={{height: "100%", width: "100%"}}
                                ><Button>
                                    {Object.values(docsPages)[activeIndex + 1].title} <FontAwesomeIcon icon={faAngleRight} />
                                </Button></NavLink> : <></>}
                        </div>
                    </Container>
                </div>
            </div>
        </>
    }
}
