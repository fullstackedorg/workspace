import {Component} from "React";
import {NavLink} from "react-router-dom";
import {docPages} from "website/src/docs/Docs";

export default class extends Component{
    props: {pages: docPages, active: number, didNavigate(): void}
    state: { sections: string[] } = { sections: [] };

    render(){
        return Object.keys(this.props.pages).map((page, index) =>
            <div key={"page-link-"+index}>
                <NavLink onClick={() => {
                    document.querySelector("#docs-navigation").classList.remove("open");
                    this.props.didNavigate();
                }} to={"/docs" + page} className={index === this.props.active ? "active" : ""}>
                    {this.props.pages[page].title}
                </NavLink>
                {index === this.props.active ? <div style={{
                    marginLeft: 20
                }}>
                    {this.state.sections.map((sectionTitle, index) => <div key={"section-"+index}>
                        <a onClick={() => document.querySelector("#docs-navigation").classList.remove("open")}
                           href={"#" + sectionTitle.toLowerCase().replace(/ /g, "-")}>
                            {sectionTitle}
                        </a>
                    </div>)}
                </div> : <></>}
        </div>)
    }
}
