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
    code{
        background-color: #535f64;
    }
    #docs-navigation,
    .box,
     pre {
        background-color: #293033;
    }
    .docs-navigation-toggle {
        background-color: #293033B0;
    }
    #express-logo{
       -webkit-filter: invert(1);
       filter: invert(1);
    }
    blockquote {
        border-left: 5px solid #535f64;
        color: #bfc0c1;
    }
`;

const hljsDark = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/styles/github-dark.min.css";
const hljsLight = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.5.1/styles/github.min.css";

export default class Layout extends Component {
    // source : https://medium.com/@tapajyoti-bose/7-killer-one-liners-in-javascript-33db6798f5bf#4603
    static darkTheme: boolean = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    props: {children: ReactElement}
    state: {menuExpanded: boolean} = {menuExpanded: false}
    highlightjsCSS = document.createElement('link');

    constructor(props: any) {
        super(props);

        const savedTheme = window.localStorage.getItem("dark");
        if(savedTheme !== null)
            Layout.darkTheme = savedTheme === "true";

        window.addEventListener('click', (e) => {
            if(!this.state.menuExpanded)
                return;

            const clickedElement = e.target as HTMLElement;
            const nav = document.querySelector("nav");
            if(nav.contains(clickedElement))
                return;

            this.setState({menuExpanded: false});
        });

        this.highlightjsCSS.href = (Layout.darkTheme ? hljsDark : hljsLight);
        this.highlightjsCSS.rel = "stylesheet";
        document.head.appendChild(this.highlightjsCSS);
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
                    code {
                        background-color: #d7dfe1;
                        border-radius: 3px;
                        padding: 3px 6px;
                        line-height: 1.5;
                        color: inherit;
                    }
                    pre > code {
                        padding: 0;
                        background-color: unset;
                    }
                    .box,
                     pre {
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
                    
                    
                    blockquote {
                        padding: 0 20px;
                        margin-bottom: 20px;
                        border-left: 5px solid #d7dfe1;
                        color: #60676e;
                    }
                `}
            </style>
            <Navbar expand="md" fixed={"top"} expanded={this.state.menuExpanded}>
                <Container className={"py-2"}>
                    <Navbar.Brand style={{opacity: 1}} href="/">
                        <img alt={"logo"} height={40} src={Layout.darkTheme ?
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
                                    defaultChecked={Layout.darkTheme}
                                    onChange={(e) => {
                                        window.localStorage.setItem("dark", e.currentTarget.checked.toString());
                                        Layout.darkTheme = e.currentTarget.checked;
                                        this.highlightjsCSS.href = (Layout.darkTheme ? hljsDark : hljsLight);
                                        this.forceUpdate();
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
            <div key={Layout.darkTheme ? "dark" : "light"}>{this.props.children}</div>
            {Layout.darkTheme ? <style>{darkThemeCSS}</style> : <></>}
        </>
    }
}
