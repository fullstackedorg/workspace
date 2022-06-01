import {Component, ReactElement} from "react";
import {Container, Nav, Navbar, Form} from "react-bootstrap";
import {NavLink} from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faMoon} from "@fortawesome/free-solid-svg-icons/faMoon";
import {faSun} from "@fortawesome/free-solid-svg-icons/faSun";
import {faGithub} from "@fortawesome/free-brands-svg-icons/faGithub";
import {faPatreon} from "@fortawesome/free-brands-svg-icons/faPatreon";
import {faTwitter} from "@fortawesome/free-brands-svg-icons/faTwitter";

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

        if(Layout.darkTheme)
            document.documentElement.classList.add("dark-theme");
        else
            document.documentElement.classList.remove("dark-theme");
    }

    render(){
        return <>
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
                                        if(Layout.darkTheme)
                                            document.documentElement.classList.add("dark-theme");
                                        else
                                            document.documentElement.classList.remove("dark-theme");
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
        </>
    }
}
