import React, {useEffect, useState} from "react";
import {Client} from "../../client";

export default function (){
    const [authOption, setAuthOption] = useState(false);
    const [sshKeyOption, setSshKeyOption] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showInstallDocker, setShowInstallDocker] = useState(false);

    const [credentialsSSH, setCredentialsSSH] = useState<Awaited<ReturnType<typeof Client.deploy.getCredentialsSSH>>>(null);
    useEffect(() => {Client.deploy.getCredentialsSSH().then(setCredentialsSSH)}, []);
    useEffect(() => {
        if(!credentialsSSH) return;
        Client.post().deploy.updateCredentialsSSH(credentialsSSH)
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
                                          defaultValue={""}
                                          onChange={e => {}}
                                ></textarea>
                            </div>
                            : <div className="mb-3">
                                <div className="form-label">SSH Key File</div>
                                {false && <div>File: {""}</div>}
                                <input type="file" className="form-control"
                                       onChange={e => {}}
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
                               password: e.currentTarget.value
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
             onClick={async () => {}} >
            {testing
                ? <div className="spinner-border" role="status"></div>
                : "Test Connection"}
        </div>
        {showInstallDocker && <div className={`btn btn-warning w-100 mt-3 ${testing && "disabled"}`}
                                   onClick={async () => {}} >
            {testing
                ? <div className="spinner-border" role="status"></div>
                : "Install Docker"}
        </div>}
    </div>
}
