import React from "react";
import {NavLink, Route, Routes} from "react-router-dom";
import Introduction from "website/src/docs/pages/Introduction";
import GettingStarted from "website/src/docs/pages/GettingStarted";
import {Button, Container, Form, FormControl} from "react-bootstrap";
import {faBars} from "@fortawesome/free-solid-svg-icons/faBars";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const docsPages = {
    "/": {
        title: "Introduction",
        component: <Introduction />
    },
    "/getting-started": {
        title: "Getting Started",
        component: <GettingStarted />
    }
}

export default class extends React.Component {
    render(){
        return <>
            <style>{`
            .docs-navigation {
                width: 300px;
                position: fixed;
                height: calc(100% - 90px);
                top: 90px;
                background-color: #d7dfe1;
            }
            .docs-navigation > .inner {
                width: 100%;
                height: 100%;
                max-width: 300px;
            }
            .docs-navigation a {
                color: black;
                text-decoration: none;
                opacity: 0.7;
            }
            .docs-navigation a.active{
                color: #05afde;
                opacity: 1;
            }
            .docs-navigation-toggle {
                background-color: #d7dfe1;
            }
            .docs-navigation a:hover{
                opacity: 1;
            }
            .docs-content {
                width: calc(100% - 300px);
                margin-left: 300px;
                display: flex;
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
                background-color: #052433B0;
                display: none;
            }
            @media (max-width: 960px){
                .docs-navigation {
                    left: -300px;
                    top: 0;
                    z-index: 9999;
                    height: 100%;
                    transition: 0.3s left;
                }
                .docs-navigation.open{
                    left: 0;
                }
                .docs-navigation.open + .docs-navigation-overlay {
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
                .docs-navigation {
                    left:0;
                    right: calc(50% + 360px);
                    width: auto;
                    display: flex;
                    justify-content: flex-end;
                }
            }
        `}</style>
            <div style={{width: "100%", maxWidth: 1320, margin: "0 auto"}}>
                <div className={"docs-navigation p-4"}>
                    <div className={"inner"}>
                        <Form className="d-flex">
                            <FormControl
                                type="search"
                                placeholder="Search"
                                className="me-2"
                                aria-label="Search"
                            />
                        </Form>
                        <div className={"mb-2"}><b>References</b></div>
                        {Object.keys(docsPages).map(page => {
                            const path = "/docs" + page;
                            const isActive = window.location.pathname === path || window.location.pathname === path.slice(0, -1);
                            return <div><NavLink onClick={() => {
                                document.querySelector(".docs-navigation").classList.remove("open");
                                this.forceUpdate();
                            }} to={path} className={isActive ? "active" : ""}>{docsPages[page].title}</NavLink></div>
                        })}
                    </div>
                </div>
                <div className={"docs-navigation-overlay"} onClick={() =>
                    document.querySelector(".docs-navigation").classList.remove("open")}/>
                <div className={"docs-navigation-toggle mb-3"}>
                    <Container className={"py-2"}>
                        <Button
                            className={"me-2"}
                            onClick={() => {
                                document.querySelector(".docs-navigation").classList.add("open");
                            }}
                        ><FontAwesomeIcon icon={faBars} /></Button>
                        <b>Navigation</b>
                    </Container>
                </div>
                <div className={"docs-content"}>
                    <Routes>
                        {Object.keys(docsPages).map(page =>
                            <Route path={page} element={docsPages[page].component} />)}
                    </Routes>
                </div>
            </div>
        </>
    }
}
