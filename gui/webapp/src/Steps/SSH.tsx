import React, {useState} from "react";
import {DEPLOY_CMD, sshCredentials} from "../../../../types/deploy";
import {WS} from "../../WebSocket";

export default function ({defaultData, updateData, getSteps}){
    const [authOption, setAuthOption] = useState(defaultData?.file || defaultData?.privateKey);
    const [sshKeyOption, setSshKeyOption] = useState(defaultData?.privateKey);
    const [testing, setTesting] = useState(false);
    const [showInstallDocker, setShowInstallDocker] = useState(false);

    return <div>
        <div>
            <label className="form-label">Server IP Address or Hostname</label>
            <input type="text" className="form-control" placeholder="XXX.XXX.XXX.XXX"
                   defaultValue={defaultData?.host}
                   onChange={e => updateData({
                       host: e.target.value
                   })}
            />
        </div>
        <div>
            <label className="form-label">SSH Port</label>
            <input type="text" className="form-control" placeholder="22"
                   defaultValue={defaultData?.sshPort}
                   onChange={e => updateData({
                       sshPort: e.target.value
                   })}
            />
        </div>
        <div>
            <label className="form-label">Username</label>
            <input type="text" className="form-control" placeholder="root"
                   defaultValue={defaultData?.username}
                   onChange={e => updateData({
                       username: e.target.value
                   })} />
        </div>
        <label className="form-label">Authentication</label>
        <div className="btn-group w-100" role="group">
            <input onClick={() => setAuthOption(false)} type="radio" className="btn-check" name="auth-option" id="btn-radio-basic-1" autoComplete="off"
                   defaultChecked={defaultData?.pass ||
                       (!defaultData?.pass && !defaultData?.privateKey && !defaultData?.file)} />
            <label htmlFor="btn-radio-basic-1" className="btn">Password</label>
            <input onClick={() => setAuthOption(true)} type="radio" className="btn-check" name="auth-option" id="btn-radio-basic-2" autoComplete="off" defaultChecked={defaultData?.privateKey || defaultData?.file} />
            <label htmlFor="btn-radio-basic-2" className="btn">SSH Key</label>
        </div>
        {authOption
            ? <div>
                <div className="btn-group w-100 mt-3" role="group">
                    <input onClick={() => setSshKeyOption(false)} type="radio" className="btn-check" name="private-key-option" id="btn-radio-basic-3" autoComplete="off" defaultChecked={!defaultData?.privateKey} />
                    <label htmlFor="btn-radio-basic-3" className="btn">File</label>
                    <input onClick={() => setSshKeyOption(true)} type="radio" className="btn-check" name="private-key-option" id="btn-radio-basic-4" autoComplete="off" defaultChecked={defaultData?.privateKey}  />
                    <label htmlFor="btn-radio-basic-4" className="btn">Text</label>
                </div>
                {
                    sshKeyOption
                        ? <div className="mb-3">
                            <label className="form-label">SSH Key</label>
                            <textarea className="form-control" name="example-textarea-input" rows={6} placeholder="-----BEGIN RSA PRIVATE KEY-----..."
                                      defaultValue={defaultData?.privateKey}
                                      onChange={e => updateData({
                                          file: null,
                                          password: null,
                                          privateKey: e.target.value
                                      })}
                            ></textarea>
                        </div>
                        : <div className="mb-3">
                            <div className="form-label">SSH Key File</div>
                            {defaultData?.file && <div>File: {defaultData.file.name}</div>}
                            <input type="file" className="form-control"
                                   onChange={e => updateData({
                                       password: null,
                                       privateKey: null,
                                       file: e.target.files[0]
                                   })}
                            />
                        </div>
                }

            </div>
            : <div>
                <label className="form-label">Password</label>
                <input type="password" className="form-control" placeholder="********"
                       defaultValue={defaultData?.password}
                       onChange={e => updateData({
                           privateKey: null,
                           file: null,
                           password: e.target.value
                       })}/>
            </div>}

        <div>
            <label className="form-label">App Directory</label>
            <input type="text" className="form-control" placeholder="/home"
                   defaultValue={defaultData?.appDir}
                   onChange={e => updateData({
                       appDir: e.target.value
                   })} />
        </div>

        <div className={`btn btn-success w-100 mt-3 ${testing && "disabled"}`}
             onClick={async () => {
                 setTesting(true);

                 const data = {...getSteps().at(0).data};

                 if(data?.file?.text)
                     data.privateKey = await data.file.text();

                 const sshCredentials: sshCredentials = data;

                 const success = await WS.cmd(DEPLOY_CMD.TEST_REMOTE_SERVER, {sshCredentials});

                 if(!success)
                    return setTesting(false);

                 const success2 = await WS.cmd(DEPLOY_CMD.TEST_DOCKER);

                 if(!success2)
                     setShowInstallDocker(true);

                 setTesting(false);
            }} >
            {testing
                ? <div className="spinner-border" role="status"></div>
                : "Test Connection"}
        </div>
        {showInstallDocker && <div className={`btn btn-warning w-100 mt-3 ${testing && "disabled"}`}
                                   onClick={async () => {
                                       setTesting(true);
                                       const success = await WS.cmd(DEPLOY_CMD.DOCKER_INSTALL);
                                       if(success)
                                           setShowInstallDocker(false);
                                       setTesting(false);
                                   }} >
            {testing
                ? <div className="spinner-border" role="status"></div>
                : "Install Docker"}
        </div>}
    </div>
}
