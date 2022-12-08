import React, {useState} from "react";

export default function (){
    const [authOption, setAuthOption] = useState(false);
    const [sshKeyOption, setSshKeyOption] = useState(false);

    return <div>
        <div>
            <label className="form-label">Server IP Address</label>
            <input type="text" className="form-control" placeholder="XXX.XXX.XXX.XXX" />
        </div>
        <div>
            <label className="form-label">Username</label>
            <input type="text" className="form-control" placeholder="root" />
        </div>
        <label className="form-label">Authentication</label>
        <div className="btn-group w-100" role="group">
            <input onClick={() => setAuthOption(false)} type="radio" className="btn-check" name="auth-option" id="btn-radio-basic-1" autoComplete="off" defaultChecked={true} />
            <label htmlFor="btn-radio-basic-1" className="btn">Password</label>
            <input onClick={() => setAuthOption(true)} type="radio" className="btn-check" name="auth-option" id="btn-radio-basic-2" autoComplete="off"  />
            <label htmlFor="btn-radio-basic-2" className="btn">SSH Key</label>
        </div>
        {authOption
            ? <div>
                <div className="btn-group w-100 mt-3" role="group">
                    <input onClick={() => setSshKeyOption(false)} type="radio" className="btn-check" name="private-key-option" id="btn-radio-basic-3" autoComplete="off" defaultChecked={true} />
                    <label htmlFor="btn-radio-basic-3" className="btn">File</label>
                    <input onClick={() => setSshKeyOption(true)} type="radio" className="btn-check" name="private-key-option" id="btn-radio-basic-4" autoComplete="off"  />
                    <label htmlFor="btn-radio-basic-4" className="btn">Text</label>
                </div>
                {
                    sshKeyOption
                        ? <div className="mb-3">
                            <label className="form-label">SSH Key</label>
                            <textarea className="form-control" name="example-textarea-input" rows="6" placeholder="-----BEGIN RSA PRIVATE KEY-----..."></textarea>
                        </div>
                        :<div className="mb-3">
                            <div className="form-label">SSH Key File</div>
                            <input type="file" className="form-control" />
                        </div>
                }

            </div>
            : <div>
                <label className="form-label">Password</label>
                <input type="text" className="form-control" placeholder="********" />
            </div>}

        <div>
            <label className="form-label">App Directory</label>
            <input type="text" className="form-control" placeholder="/home" />
            <small className={"text-muted"}>Default Value: /home</small>
        </div>
    </div>
}
