import {Component} from "react"
import {fetch} from "fullstacked/fetch";

export default class extends Component {
    state = {
        text: "fetching..."
    }

    async componentDidMount(){
        try{
            await fetch.post("/api/test", {});
            await fetch.put("/api/test", {});
            await fetch.del("/api/test");
        }catch (e) {
            return;
        }
        this.setState({text: await fetch.get("/api/test")});
    }

    render(){
        return <div>{this.state.text}</div>
    }
}
