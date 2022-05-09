import {Table} from "react-bootstrap";
import Layout from "../../layout/Layout";
import {NavLink} from "react-router-dom";

export default function(){
    return <>
        <Table striped bordered variant={Layout.darkTheme ? "dark" : "light"}>
            <tbody>
            <tr>
                <td><NavLink to={"/docs/creating"} style={{whiteSpace: "nowrap"}}>npx fullstacked create</NavLink></td>
                <td>Generate the default files <span className={"code"}>index.tsx</span> and <span className={"code"}>server.ts</span> files.</td>
            </tr>
            <tr>
                <td><NavLink to={"/docs/developing"} style={{whiteSpace: "nowrap"}}>npx fullstacked watch</NavLink></td>
                <td>Rebuilds your app and hot reloads on changes.</td>
            </tr>
            <tr>
                <td><NavLink to={"/docs/building"} style={{whiteSpace: "nowrap"}}>npx fullstacked build</NavLink></td>
                <td>Build your app in production mode to your <span className={"code"}>dist</span> folder.</td>
            </tr>
            <tr>
                <td><NavLink to={"/docs/testing"} style={{whiteSpace: "nowrap"}}>npx fullstacked test</NavLink></td>
                <td>Run tests throughout your app.</td>
            </tr>
            <tr>
                <td><NavLink to={"/docs/deploying"} style={{whiteSpace: "nowrap"}}>npx fullstacked deploy</NavLink></td>
                <td>Send a production build to a remote host to deploy your web app to the internet.</td>
            </tr>
            </tbody>
        </Table>
    </>
}
