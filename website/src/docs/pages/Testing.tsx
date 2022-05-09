import {Table} from "react-bootstrap";
import Layout from "../../layout/Layout";

export default function (){
    return <>
        <h3>Command</h3>
        <div className={"code box"}>
            npx fullstacked test
        </div>
        <h3>Flags</h3>
        <Table striped bordered variant={Layout.darkTheme ? "dark" : "light"}>
            <tbody>
            <tr>
                <td><em style={{whiteSpace: "nowrap"}}>--headless</em></td>
                <td>Will pass the headless flag to puppeteer. Very useful for running test in your CI.</td>
            </tr>
            <tr>
                <td><em style={{whiteSpace: "nowrap"}}>--coverage</em></td>
                <td>Will generate code coverage. It will run <span className={"code"}>nyc</span> tool with your
                mocha tests. It uses the HTML and summary reporters.</td>
            </tr>
            </tbody>
        </Table>
    </>
}
