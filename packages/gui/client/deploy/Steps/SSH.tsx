import React, {useEffect, useState} from "react";
import {Client} from "../../client";
import Console from "../../Console";
import type {CredentialsSSH} from "@fullstacked/deploy";

let throttler = null;

export default function (){
    const [authOption, setAuthOption] = useState(false);
    const [sshKeyOption, setSshKeyOption] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showInstallDocker, setShowInstallDocker] = useState(false);

    const [credentialsSSH, setCredentialsSSH] = useState<CredentialsSSH>(null);
    useEffect(() => {Client.get().deploy.getCredentialsSSH().then(creds => {
        if(creds.privateKey) {
            setAuthOption(true);
            setSshKeyOption(true);
        }

        setCredentialsSSH(creds);
    })}, []);
    useEffect(() => {
        if(!credentialsSSH) return;

        if(throttler) clearTimeout(throttler);
        throttler = setTimeout(() => {
            throttler = null;
            Client.post().deploy.updateCredentialsSSH(credentialsSSH);
        }, 300);

    }, [credentialsSSH]);

    if(credentialsSSH === null) return;

    return <div>
        <div style={{position: "relative"}}>

            <div>
                <label className="form-label">Server IP Address or Hostname</label>
                <input type="text" className="form-control" placeholder="XXX.XXX.XXX.XXX"
                       defaultValue={credentialsSSH.host}
                       onChange={e => setCredentialsSSH({
                           ...credentialsSSH,
                           host: e.target.value
                       })}
                />
            </div>
            <div>
                <label className="form-label">SSH Port</label>
                <input type="text" className="form-control" placeholder="22"
                       defaultValue={credentialsSSH.port}
                       onChange={e => setCredentialsSSH({
                           ...credentialsSSH,
                           port: parseInt(e.target.value)
                       })}
                />
            </div>
            <div>
                <label className="form-label">Username</label>
                <input type="text" className="form-control" placeholder="root"
                       defaultValue={credentialsSSH.username}
                       onChange={e => setCredentialsSSH({
                           ...credentialsSSH,
                           username: e.target.value
                       })} />
            </div>
            <label className="form-label">Authentication</label>
            <div className="btn-group w-100" role="group">
                <input onClick={() => setAuthOption(false)} type="radio" className="btn-check" name="auth-option" id="btn-radio-basic-1" autoComplete="off"
                       defaultChecked={!!credentialsSSH.password || (!credentialsSSH.password && !credentialsSSH.privateKey)} />
                <label htmlFor="btn-radio-basic-1" className="btn">Password</label>
                <input onClick={() => setAuthOption(true)} type="radio" className="btn-check" name="auth-option" id="btn-radio-basic-2" autoComplete="off"
                       defaultChecked={!!credentialsSSH.privateKey} />
                <label htmlFor="btn-radio-basic-2" className="btn">SSH Key</label>
            </div>
            {authOption
                ? <div>
                    <div className="btn-group w-100 mt-3" role="group">
                        <input onClick={() => setSshKeyOption(false)} type="radio" className="btn-check" name="private-key-option" id="btn-radio-basic-3" autoComplete="off"
                               defaultChecked={!credentialsSSH.privateKey} />
                        <label htmlFor="btn-radio-basic-3" className="btn">File</label>
                        <input onClick={() => setSshKeyOption(true)} type="radio" className="btn-check" name="private-key-option" id="btn-radio-basic-4" autoComplete="off"
                               defaultChecked={!!credentialsSSH.privateKey}  />
                        <label htmlFor="btn-radio-basic-4" className="btn">Text</label>
                    </div>
                    {
                        sshKeyOption
                            ? <div className="mb-3">
                                <label className="form-label">SSH Key</label>
                                <textarea className="form-control" name="example-textarea-input" rows={6} placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                                          defaultValue={credentialsSSH.privateKey}
                                          onChange={e => setCredentialsSSH({
                                              ...credentialsSSH,
                                              password: null,
                                              privateKey: e.currentTarget.value
                                          })}
                                ></textarea>
                            </div>
                            : <div className="mb-3">
                                <div className="form-label">SSH Key File</div>
                                <input type="file" className="form-control"
                                       onChange={async e => {
                                           if(!e.currentTarget.files[0]) return;
                                           const fd = new FileReader();
                                           const readPromise = new Promise((res) => {
                                               fd.onload = res
                                               fd.readAsText(e.currentTarget.files[0])
                                           });
                                           await readPromise;
                                           setCredentialsSSH({
                                               ...credentialsSSH,
                                               privateKey: fd.result.toString()
                                           });
                                       }}
                                />
                            </div>
                    }

                </div>
                : <div>
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control" placeholder="********"
                           defaultValue={credentialsSSH.password}
                           onChange={e => setCredentialsSSH({
                               ...credentialsSSH,
                               password: e.currentTarget.value,
                               privateKey: null
                           })}/>
                </div>}

            <div>
                <label className="form-label">Server Directory</label>
                <input type="text" className="form-control" placeholder="/home"
                       defaultValue={credentialsSSH.directory}
                       onChange={e => setCredentialsSSH({
                           ...credentialsSSH,
                           directory: e.currentTarget.value
                       })} />
            </div>
        </div>

        <div className={`btn btn-success w-100 mt-3 ${testing && "disabled"}`}
             onClick={async () => {
                setTesting(true);
                let test = false;
                try {
                    test = await Client.get().deploy.testConnection();
                }catch (e) {
                    Console.instance.push({data: e, type: "ERROR"})
                }
                if(!test)
                     Console.instance.push({data: "Failed to connect", type: "ERROR"});
                else{

                    let dockerInstalled = false;
                    try {
                        dockerInstalled = await Client.get().deploy.testDocker();
                    }catch (e) {
                        Console.instance.push({data: e, type: "ERROR"});
                    }

                    setShowInstallDocker(!dockerInstalled);
                }

                setTesting(false);
             }} >
            {testing
                ? <div className="spinner-border" role="status"></div>
                : "Test Connection"}
        </div>
        {showInstallDocker && <div className={`btn btn-warning w-100 mt-3 ${testing && "disabled"}`}
                                   onClick={async () => {
                                       setTesting(true);
                                       await Client.get().deploy.installDocker();

                                       let dockerInstalled = false;
                                       try {
                                           dockerInstalled = await Client.get().deploy.testDocker();
                                       }catch (e) {
                                           Console.instance.push({data: e, type: "ERROR"});
                                       }

                                       setShowInstallDocker(!dockerInstalled);

                                       setTesting(false);
                                   }} >
            {testing
                ? <div className="spinner-border" role="status"></div>
                : "Install Docker"}
        </div>}
    </div>
}
