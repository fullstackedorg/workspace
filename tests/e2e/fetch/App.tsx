import React, {Component} from "react"

export default class extends Component {
    state = {
        text: "fetching..."
    }

    async componentDidMount(){
        const request = await fetch("/api/test");
        this.setState({
            text: await request.text()
        });
    }

    render(){
        return <div>{this.state.text}</div>
    }
}
