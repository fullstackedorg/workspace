import {Component} from "React";
import {Location, NavLink} from "react-router-dom";
import {docPages} from "website/src/docs/Docs";

type DocsNavigationProps = { pages: docPages, location: Location};

export default class extends Component{
    props: DocsNavigationProps;
    state: { sections: string[] } = { sections: [] };

    componentDidMount() {
        window.scrollTo({top: 0, left: 0, behavior: "smooth"});
        this.checkForSections();
    }

    componentDidUpdate(prevProps: Readonly<DocsNavigationProps>, prevState: Readonly<{}>, snapshot?: any) {
        if(prevProps.location.pathname === this.props.location.pathname)
            return;

        window.scrollTo({top: 0, left: 0, behavior: "smooth"});
        this.checkForSections();
    }

    checkForSections(){
        const sections = Array.from(document.querySelectorAll("h3")).map(section => {
            const sectionTitle = section.innerText;
            section.setAttribute("id", this.slugishString(sectionTitle))
            return sectionTitle;
        });
        this.setState({sections: sections});
    }

    slugishString(str: string){
        return str.toLowerCase().replace(/ /g, "-")
    }

    render(){
        return Object.keys(this.props.pages).map((page, index) => {

            const path = "/docs" + page;
            const isActive = window.location.pathname === path || window.location.pathname === path.slice(0, -1) ||
                window.location.pathname.slice(0, -1) === path;

            return <div key={"page-link-"+index}>
                <NavLink onClick={() => {
                    document.querySelector("#docs-navigation").classList.remove("open");
                }} to={"/docs" + page} className={isActive ? "active" : ""}>
                    {this.props.pages[page].title}
                </NavLink>
                {isActive ? <div style={{ marginLeft: 20 }}>
                    {this.state.sections.map((sectionTitle, index) => <div key={"section-"+index}>
                        <a onClick={() => document.querySelector("#docs-navigation").classList.remove("open")}
                           href={"#" + this.slugishString(sectionTitle)}>
                            {sectionTitle}
                        </a>
                    </div>)}
                </div> : <></>}
            </div>
        })
    }
}
