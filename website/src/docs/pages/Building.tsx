import Layout from "../../layout/Layout";
import {Table} from "react-bootstrap";

export default function(){
    return <>
        <h3>Command</h3>
        <div className={"box code"}>
            npx fullstacked build
        </div>
        <p>
            This produce a production build in a <span className={"code"}>dist</span> directory
            at your project's root.
        </p>
        <h3>Run your Built App</h3>
        <p>
            You can easily startup your app with a simple :
        </p>
        <div className={"code box"}>
            node dist/index
        </div>
        <p>
            Just like any other node script!
        </p>
        <h3>Flags</h3>
        <Table striped bordered variant={Layout.darkTheme ? "dark" : "light"}>
            <tbody>
            <tr>
                <td><em style={{whiteSpace: "nowrap"}}>--src=</em></td>
                <td>Change the entry directory of your app. In other words, where both your&nbsp;
                    <span className={"code"}>index.tsx</span> and <span className={"code"}>server.ts</span> are.
                    Default is <span className={"code"}>process.cwd()</span>.
                </td>
            </tr>
            <tr>
                <td><em style={{whiteSpace: "nowrap"}}>--out=</em></td>
                <td>
                    Change the location of the output <span className={"code"}>dist</span> directory.
                    Default is <span className={"code"}>process.cwd()</span>.
                </td>
            </tr>
            </tbody>
        </Table>
    </>
}
