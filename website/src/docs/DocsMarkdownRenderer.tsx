import {Component} from "react";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import axios from "axios";
import {Container} from "react-bootstrap";
import Layout from "../layout/Layout";

export default class extends Component {
    props: { mdFile: string, didUpdateContent(): void }
    state: { content: string } = {content: null}
    md = new MarkdownIt({
        html: true,
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(str, { language: lang }).value;
                } catch (__) { }
            }

            return '';
        }
    });

    componentDidMount() {
        this.loadMdFile();
    }

    componentDidUpdate(prevProps: Readonly<{mdFile: string}>, prevState: Readonly<{}>, snapshot?: any) {
        if(prevProps.mdFile !== this.props.mdFile)
            this.loadMdFile();
    }

    async loadMdFile(){
        this.setState({content: (await axios.get(this.props.mdFile)).data}, this.props.didUpdateContent)
    }

    render(){
        if(!this.state.content)
            return <div />
        return <Container dangerouslySetInnerHTML={{__html:
                this.md.render(this.state.content).replace(/<table>/g, `<table class="table table-${Layout.darkTheme ? "dark" : "light"} table-striped table-bordered">`)}} />
    }
}
