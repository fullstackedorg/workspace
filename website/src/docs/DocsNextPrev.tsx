import {Component} from "React";
import {Location, NavLink} from "react-router-dom";
import {docPages} from "website/src/docs/Docs";
import {Button, Container} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleLeft} from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import {faAngleRight} from "@fortawesome/free-solid-svg-icons/faAngleRight";

export default class extends Component{
    props: { pages: docPages, location: Location}

    render(){
        let activeIndex = 0;
        Object.keys(this.props.pages).forEach((page, index) => {
            const path = "/docs" + page;
            const isActive = window.location.pathname === path || window.location.pathname === path.slice(0, -1) ||
                window.location.pathname.slice(0, -1) === path;
            if(isActive) activeIndex = index;
        });

        return <Container className={"my-4 docs-buttons d-flex justify-content-between"} style={{
            width: "100%",
            height: 70
        }}>
            <div style={{width: "49%"}}>
                {activeIndex !== 0 ?
                    <NavLink
                        to={"/docs" + Object.keys(this.props.pages)[activeIndex - 1]}
                        onClick={() => this.forceUpdate()}
                        style={{height: "100%", width: "100%"}}
                    ><Button variant={"secondary"}>
                        <FontAwesomeIcon icon={faAngleLeft} /> {Object.values(this.props.pages)[activeIndex - 1].title}
                    </Button></NavLink> : <></>}
            </div>
            <div style={{width: "49%"}}>
                {activeIndex !== Object.keys(this.props.pages).length - 1 ?
                    <NavLink
                        to={"/docs" + Object.keys(this.props.pages)[activeIndex + 1]}
                        onClick={() => this.forceUpdate()}
                        style={{height: "100%", width: "100%"}}
                    ><Button>
                        {Object.values(this.props.pages)[activeIndex + 1].title} <FontAwesomeIcon icon={faAngleRight} />
                    </Button></NavLink> : <></>}
            </div>
        </Container>
    }
}
