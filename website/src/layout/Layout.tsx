import React, {ReactElement} from "react";
import {Container, Nav, Navbar, Form} from "react-bootstrap";
import {NavLink} from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faMoon} from "@fortawesome/free-solid-svg-icons/faMoon";
import {faSun} from "@fortawesome/free-solid-svg-icons/faSun";
import {faGithub} from "@fortawesome/free-brands-svg-icons/faGithub";
import {faPatreon} from "@fortawesome/free-brands-svg-icons/faPatreon";
import {faTwitter} from "@fortawesome/free-brands-svg-icons/faTwitter";
import logoLight from "website/src/images/logo-light.png";
import logoDark from "website/src/images/logo-dark.png";

const darkThemeCSS = `
    html, body {
        background-color: #212529;
        color: #f8f9fa;
    }
    .navbar-toggler{
        filter: invert(1);
    }
    nav{
        background-color: #212529
    }
    nav a,
    .nav-link,
    .docs-navigation a {
        color: white;
        opacity: 0.7;
    }
    .nav-link:hover{
        opacity: 1;
        color: white;
    }
   .docs-navigation,
    .box {
        background-color: #293033;
   }
   .docs-navigation-toggle {
        background-color: #293033B0;
   }
   #express-logo{
       -webkit-filter: invert(1);
       filter: invert(1);
   }
`;

export default class Layout extends React.Component {
    props: {children: ReactElement}
    state: {darkTheme: boolean} = {darkTheme: true}

    constructor(props: any) {
        super(props);

        const savedTheme = window.localStorage.getItem("dark");
        if(savedTheme !== null)
            this.state.darkTheme = savedTheme === "true";
    }

    render(){
        return <>
            <style>
                {`
                    html, body {
                        overflow-x: hidden;
                    }
                    .display-3,
                    .display-4{
                        font-weight: 700!important;
                    }
                    nav{
                        background-color: white
                    }
                    nav a {
                        text-decoration: none;
                        color: #212529;
                    }
                    nav a.active {
                        color: #05afde;
                        opacity: 1;
                    }
                    .nav-link{
                        color: black;
                        opacity: 0.7;
                    }
                    .nav-link:hover{
                        opacity: 1;
                        color: black;
                    }
                    .my-10{
                        margin-top: 100px;
                        margin-bottom: 100px;
                    }
                    .code {
                        font-family: SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;
                        font-size: smaller;
                        text-align: left;
                    }
                    .box {
                        background-color: #d7dfe1;
                        border-radius: 12px;
                    }
                    #hero{
                        position: absolute;
                        height: 600px;
                        width: 600px;
                        right: 0;
                        bottom: 0;
                        z-index: -1;
                        transform: translate(30%, 50%);
                    }
                    @media (max-width: 960px){
                        #hero{
                            height: 400px;
                            width: 400px;
                        }
                    }
                    @media (max-width: 450px){
                        #hero{
                            height: 300px;
                            width: 300px;
                        }
                    }
                `}
            </style>
            <Navbar expand="md" fixed={"top"}>
                <Container className={"py-2"}>
                    <Navbar.Brand style={{opacity: 1}} href="/">
                        <img src={this.state.darkTheme ? logoLight : logoDark} alt={"logo"} height={40}/>
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse className="justify-content-end">
                        <Nav.Link as={"span"} className={window.location.pathname.startsWith("/docs") ? "" : "active"}>
                            <NavLink to="/">Home</NavLink>
                        </Nav.Link>
                        <Nav.Link as={"span"} className={window.location.pathname.startsWith("/docs") ? "active" : ""}>
                            <NavLink to="/docs">Docs</NavLink>
                        </Nav.Link>
                        <div className={"d-flex align-items-center ms-3 me-2"}>
                            <div className={"me-2 mt-1"} style={{opacity: 0.7}}><FontAwesomeIcon icon={faSun}/></div>
                            <Form.Check
                                type="switch"
                                defaultChecked={this.state.darkTheme}
                                onChange={(e) => {
                                    window.localStorage.setItem("dark", e.currentTarget.checked.toString());
                                    this.setState({darkTheme: e.currentTarget.checked})
                                }}
                            />
                            <div className={"mt-1"} style={{opacity: 0.7}}><FontAwesomeIcon icon={faMoon}/></div>
                        </div>
                        <a className={"nav-link"} href={"https://github.com/CPLepage/fullstacked"} target={"_blank"}><FontAwesomeIcon icon={faGithub} /></a>
                        <a className={"nav-link"} href={""}><FontAwesomeIcon icon={faTwitter} /></a>
                        <a className={"nav-link"} href={""}><FontAwesomeIcon icon={faPatreon} /></a>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <div style={{height: 90}} />
            {this.props.children}
            {this.state.darkTheme ? <style>{darkThemeCSS}</style> : <></>}
        </>
    }
}
