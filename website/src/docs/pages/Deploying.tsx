import Layout from "../../layout/Layout";
import {Table} from "react-bootstrap";

export default function (){
    return <>
        <h3>Requirements</h3>
        <p>
            You need a server that run <span className={"code"}>yum</span> as it's package manager.<br />
            Anything like the OS in this list works :
        </p>
        <ul>
            <li>RHEL</li>
            <li>CentOS</li>
            <li>Rocky</li>
            <li>Amazon Linux 2</li>
        </ul>
        <p>
            You will also need an SSH access with a password or with a private key file.
        </p>
        <h3>Command</h3>
        <div className={"code box"}>
            npx fullstacked deploy
        </div>
        <h3>Flags</h3>
        <div style={{width: "100%", overflow: "auto"}}>
            <Table striped bordered variant={Layout.darkTheme ? "dark" : "light"}>
                <tbody>
                <tr>
                    <td><em style={{whiteSpace: "nowrap"}}>--host=</em></td>
                    <td>Your remote host instance address. e.g., <span className={"code"}>--host=55.30.44.223</span>
                        &nbsp;or <span className={"code"}>--host=example.com</span></td>
                </tr>
                <tr>
                    <td><em style={{whiteSpace: "nowrap"}}>--user=</em></td>
                    <td>Your ssh user name. e.g., <span className={"code"}>--user=ec2-user</span></td>
                </tr>
                <tr>
                    <td><em style={{whiteSpace: "nowrap"}}>--pass=</em></td>
                    <td>Your ssh password. e.g., <span className={"code"}>--pass=foobar</span><br/>
                        Use this or a private key file to authenticate on your remote host.</td>
                </tr>
                <tr>
                    <td><em style={{whiteSpace: "nowrap"}}>--private-key=</em></td>
                    <td>Your ssh private key. e.g., <span className={"code"}>--private-key=/Users/me/SSHPrivateKey.pem</span><br/>
                        Use this or a password to authenticate on your remote host.</td>
                </tr>
                <tr>
                    <td><em style={{whiteSpace: "nowrap"}}>--app-dir=</em></td>
                    <td>Where you want to put your app inside your remote host. e.g.,
                        <span className={"code"}>--app-dir=/home/ec2-user</span></td>
                </tr>
                </tbody>
            </Table>
        </div>
    </>
}
