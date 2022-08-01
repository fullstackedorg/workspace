import {Component} from "react"
import {Webapp} from "fullstacked/webapp";

export default class extends Component {
    state = {
        text: "fetching..."
    }

    async componentDidMount(){
        try{
            await Webapp.post("/api/test", {});
            await Webapp.put("/api/test", {});
            await Webapp.del("/api/test");
        }catch (e) {
            return;
        }
        this.setState({text: await Webapp.get("/api/test")});
    }

    render(){
        return <div>{this.state.text}</div>
    }
}
