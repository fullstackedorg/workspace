import React from "react";
import {Container} from "react-bootstrap";

export default function (){
    return <Container>
        <h1>Default Files</h1>
        <h3>Command</h3>
        <p>
            To generate the default starter files, simply run the following command:
        </p>
        <div className={"box code"}>
            fullstacked create
        </div>
        <p>
            This create two files : <span className={"code"}>server.ts</span> and <span className={"code"}>index.tsx</span>.
            These files are your entrypoints for your server and webapp respectively.
        </p>
        <h3>server.ts</h3>
        <div className={"box code"}>
            import Server from "fullstacked/server";<br />
            <br />
            const server = new Server();<br />
            <br />
            server.start();
        </div>
        <p>
            This is your <b>Server</b>(backend) entrypoint. No need register your public static folder. It's all taken care of
        </p>
        <div className={"box code"}>
            <del>const app = require("express");<br />
                app.use(express.static("public"));</del>
        </div>
        <p>
            You can always access the express instance to register routes under your server instance like this :
        </p>
        <div className={"box code"}>
            server.express.get("/hello-world",<br />
            &nbsp;&nbsp;&nbsp;&nbsp;(req, res) =&gt; res.send("Hello World"));
        </div>

        <h3>index.tsx</h3>
        <div className={"box code"}>
            import * as React from 'react';<br />
            import Webapp from "fullstacked/webapp";<br />
            <br />
            Webapp(&lt;div&gt;Welcome to FullStacked!&lt;/div&gt;);
        </div>
        <p>
            This is your <b>Webapp</b>(frontend) entrypoint. No need to use render from react-dom or setup an HTML file. Once again,
            it's all take care of
        </p>
        <div className={"box code"}>
            <del>const reactDOM = require("react-dom");<br />
                reactDOM.render(&lt;App/&gt;, document.getElementById("#root"));</del>
        </div>
        <p>
            Simply put your <span className={"code"}>&lt;App/&gt;</span> as parameter to the&nbsp;
            <span className={"code"}>Webapp</span> function and everything should start as expected.
        </p>
    </Container>
}
