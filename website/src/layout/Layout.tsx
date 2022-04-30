import {Component, ReactElement} from "react";
import {Container, Nav, Navbar, Form} from "react-bootstrap";
import {NavLink} from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faMoon} from "@fortawesome/free-solid-svg-icons/faMoon";
import {faSun} from "@fortawesome/free-solid-svg-icons/faSun";
import {faGithub} from "@fortawesome/free-brands-svg-icons/faGithub";
import {faPatreon} from "@fortawesome/free-brands-svg-icons/faPatreon";
import {faTwitter} from "@fortawesome/free-brands-svg-icons/faTwitter";

const darkThemeCSS = `
    html, body {
        background-color: #212529;
        color: #f8f9fa;
    }
    a {
        color: #01b0de;
    }
    a:hover {
        color: #0a85b5;
    }
    .navbar-toggler{
        filter: invert(1);
    }
    nav{
        background-color: #212529
    }
    nav a,
    .nav-link,
    #docs-navigation a {
        color: white;
        opacity: 0.7;
    }
    .nav-link:hover{
        opacity: 1;
        color: white;
    }
   #docs-navigation,
   .code,
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

export default class Layout extends Component {
    props: {children: ReactElement}
    state: {darkTheme: boolean, menuExpanded: boolean} = {
        // thanks to source : https://medium.com/@tapajyoti-bose/7-killer-one-liners-in-javascript-33db6798f5bf#4603
        darkTheme: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
        menuExpanded: false
    }

    constructor(props: any) {
        super(props);

        const savedTheme = window.localStorage.getItem("dark");
        if(savedTheme !== null)
            this.state.darkTheme = savedTheme === "true";

        window.addEventListener('click', (e) => {
            if(!this.state.menuExpanded)
                return;

            const clickedElement = e.target as HTMLElement;
            const nav = document.querySelector("nav");
            if(nav.contains(clickedElement))
                return;

            this.setState({menuExpanded: false});
        });
    }

    render(){
        return <>
            <style>
                {`
                    html, body {
                        overflow-x: hidden;
                    }
                    .form-check-input{
                        cursor: pointer;
                    }
                    .form-check-input:checked,
                    .btn-primary{
                        background-color: #01b0de;
                        border-color: #01b0de;
                    }
                    .btn-primary:hover,
                    .btn-primary:focus{
                        background-color: #0a85b5;
                        border-color: #0a85b5;
                    }
                    .btn-primary:focus,
                    .form-check-input:focus{
                        box-shadow: 0 0 0 0.25rem rgb(10 133 181 / 50%);
                    }
                    .display-3,
                    .display-4{
                        font-weight: 700!important;
                    }
                    a {
                        color: #0a85b5;
                        text-decoration: none;
                    }
                    a:hover {
                        color: #01b0de;
                    }
                    nav{
                        background-color: white
                    }
                    nav a {
                        text-decoration: none;
                        color: #212529;
                    }
                    nav hr {
                        display: none;
                    }
                    nav a.active {
                        color: #05afde;
                        opacity: 1;
                    }
                    .nav-link{
                        color: black;
                        opacity: 0.7;
                    }
                    .nav-link a {
                        display: block;
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
                        white-space: nowrap;
                        overflow: auto;
                        background-color: #d7dfe1;
                        border-radius: 3px;
                        padding: 3px 6px;
                    }
                    .box {
                        background-color: #d7dfe1;
                        border-radius: 12px;
                    }
                    #hero{
                        position: absolute;
                        height: 800px;
                        width: 800px;
                        right: 0;
                        bottom: 0;
                        z-index: -1;
                        transform: translate(30%, 50%);
                    }
                    @media (max-width: 1200px){
                        #hero{
                            height: 600px;
                            width: 600px;
                        }
                    }
                    @media (max-width: 960px){
                        #hero{
                            height: 450px;
                            width: 450px;
                        }
                    }
                    @media (max-width: 450px){
                        #hero{
                            height: 300px;
                            width: 300px;
                        }
                    }
                    @media (max-width: 768px){
                        nav hr {
                            display: block;
                        }
                    }
                    
                    #quote{
                        max-width: 660px;
                    }
                    @media (max-width: 1020px){
                        #quote{
                            max-width: 600px;
                        }
                    }
                    @media (max-width: 630px){
                        #quote{
                            max-width: 470px;
                        }
                    }@media (max-width: 420px){
                        #quote{
                            font-size: calc(1.325rem + 3.3vw);
                        }
                    }
                    
                `}
            </style>
            <Navbar expand="md" fixed={"top"} expanded={this.state.menuExpanded}>
                <Container className={"py-2"}>
                    <Navbar.Brand style={{opacity: 1}} href="/">
                        <img alt={"logo"} height={40} src={this.state.darkTheme ?
                            require("website/src/images/logo-light.png") :
                            require("website/src/images/logo-dark.png")} />
                    </Navbar.Brand>
                    <Navbar.Toggle onClick={() => this.setState({menuExpanded: !this.state.menuExpanded})} />
                    <Navbar.Collapse className="justify-content-end">
                        <Nav.Link as={"span"} className={window.location.pathname.startsWith("/docs") ? "" : "active"}
                                  onClick={() => this.setState({menuExpanded: false})} >
                            <NavLink to="/">Home</NavLink>
                        </Nav.Link>
                        <Nav.Link as={"span"} className={window.location.pathname.startsWith("/docs") ? "active" : ""}
                                  onClick={() => this.setState({menuExpanded: false})} >
                            <NavLink to="/docs">Docs</NavLink>
                        </Nav.Link>
                        <hr />
                        <div style={{display: "flex"}}>
                            <div id={"appearance"} className={"d-flex align-items-center ms-3 me-2"}>
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
                            <div id="socials" style={{display: "flex", paddingTop: 4}}>
                                <a className={"nav-link"} href={"https://github.com/CPLepage/fullstacked"} target={"_blank"}><FontAwesomeIcon icon={faGithub} /></a>
                                <a className={"nav-link"} href={"https://twitter.com/cp_lepage"} target={"_blank"}><FontAwesomeIcon icon={faTwitter} /></a>
                                <a className={"nav-link"} href={"https://www.patreon.com/fullstacked"} target={"_blank"}><FontAwesomeIcon icon={faPatreon} /></a>
                            </div>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <div style={{height: 82}} />
            {this.props.children}
            {this.state.darkTheme ? <style>{darkThemeCSS}</style> : <></>}
        </>
    }
}
