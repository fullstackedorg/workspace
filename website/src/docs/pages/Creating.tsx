export default function (){
    return <>
        <h3>Command</h3>
        <p>
            It generates the default starter files, simply run the following command:
        </p>
        <div className={"box code"}>
            npx fullstacked create
        </div>
        <p>
            This create two files : <span className={"code"}>server.ts</span>
            , <span className={"code"}>index.tsx</span> and <span className={"code"}>test.ts</span>.
            These files are your entrypoints for your server, web app and tests respectively.
        </p>
        <h3>Default Files</h3>
        <h6>server.ts</h6>
        <div className={"box code"}>
            import Server from "fullstacked/server";<br />
            <br />
            const server = new Server();<br />
            <br />
            server.express.get("/hello-world",<br />
            &nbsp;&nbsp;&nbsp;&nbsp;(req, res) =&gt; res.send("Hello World"));<br />
            <br />
            server.start();<br />
            <br />
            export default server;
        </div>
        <p>
            This is your <b>Server</b>(backend) entrypoint. No need register your public static folder. It's all taken care of
        </p>

        <h6>index.tsx</h6>
        <div className={"box code"}>
            import Webapp from "fullstacked/webapp";<br />
            <br />
            Webapp(&lt;&gt;Welcome to FullStacked!&lt;/&gt;);
        </div>
        <p>
            This is your <b>Webapp</b>(frontend) entrypoint. No need to use render from react-dom or setup an HTML file. Once again,
            it's all take care of.
        </p>
        <h6>test.ts</h6>
        <div className={"box code"} dangerouslySetInnerHTML={{__html:
                `import * as assert from "assert";<br>
            import {before, describe} from "mocha";<br>
            import Helper from "fullstacked/tests/integration/Helper"<br>
            import server from "./server";<br>
            import axios from "axios";<br>
            <br>
            describe("Integration", function(){<br>
            &nbsp;&nbsp;&nbsp;&nbsp;let test;<br>
            <br>
            &nbsp;&nbsp;&nbsp;&nbsp;before(async function (){<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;test = new Helper(__dirname);<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;await test.start()<br>
            &nbsp;&nbsp;&nbsp;&nbsp;});<br>
            <br>
            &nbsp;&nbsp;&nbsp;&nbsp;it('Should hit endpoint', async function(){<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;assert.equal((await axios.get("/hello-world")).data, "Hello World")<br>
            &nbsp;&nbsp;&nbsp;&nbsp;});<br>
            <br>
            &nbsp;&nbsp;&nbsp;&nbsp;after(async function(){<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;await test.stop();<br>
            &nbsp;&nbsp;&nbsp;&nbsp;});<br>
            });<br>
            <br>
            describe("End-to-End", function(){<br>
            &nbsp;&nbsp;&nbsp;&nbsp;before(async function (){<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;server.start({silent: true, testing: true});<br>
            &nbsp;&nbsp;&nbsp;&nbsp;});<br>
            <br>
            &nbsp;&nbsp;&nbsp;&nbsp;it('Should load default page', async function(){<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const root = await test.page.$("#root");<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const innerHTML = await root.getProperty('innerHTML');<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const value = await innerHTML.jsonValue();<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;assert.equal(value, "Welcome to FullStacked!");<br>
            &nbsp;&nbsp;&nbsp;&nbsp;});<br>
            <br>
            &nbsp;&nbsp;&nbsp;&nbsp;after(async function (){<br>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;server.stop();<br>
            &nbsp;&nbsp;&nbsp;&nbsp;});<br>
            });`}} />
        <p>
            This is your initial testing file. Tests written here are just good examples. You'll learn more about how
            to create and add some test in the next documentation page.
        </p>
    </>
}
