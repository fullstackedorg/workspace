import React, {useEffect, useRef, useState} from "react";
import {DataStore} from "../DataStore";

export default function (){
    if(window.location.protocol === "https:")
        return <></>

    const [ip, setIp] = useState();
    const [open, setOpen] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        DataStore.getIP().then(setIp);
    }, [])

    if(!ip || window.location.host === ip || !open) return <></>

    return <>
        <div className="alert alert-warning alert-dismissible" role="alert">
            <h3 className="mb-1 fw-bold">Generate SSL certificates for your FullStacked Portal</h3>
            <p>You are using FullStacked Portal with a custom domain, but without SSL certificates. Please take the time to generate SSL certificate.</p>
            <div className="btn-list">
                <button onClick={() => setShowForm(true)} className="btn btn-warning">Generate</button>
            </div>
            <div onClick={() => setOpen(false)} className="btn-close" data-bs-dismiss="alert" aria-label="close"></div>
        </div>
        {showForm && <CertificatesForm onClose={() => setShowForm(false)}/>}
    </>
}


function CertificatesForm({onClose}){
    const [showLogs, setShowLogs] = useState(false);
    const logsRef = useRef();
    const emailRef = useRef();

    return <>
        <div className="modal-backdrop fade show"></div>
        <div className="modal modal-blur fade show" id="modal-team" tabIndex="-1" role="dialog" aria-modal="true"
                style={{display: "block"}}>
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Generate Portal Certificates</h5>
                    </div>
                    <div className="modal-body">
                        <form>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input ref={emailRef} type="text" className="form-control" name="email" />
                            </div>
                        </form>
                        {showLogs && <pre ref={logsRef} style={{maxHeight: 300}} />}
                    </div>
                    <div className="modal-footer">
                        <button onClick={onClose} type="button" className="btn me-auto" data-bs-dismiss="modal">Close</button>
                        <button onClick={async () => {
                            const stream = await fetch("/certs", {
                                method: "POST",
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    hostnames: [window.location.host],
                                    email: emailRef.current.value,
                                    appID: "fullstacked-server"
                                })
                            });
                            setShowLogs(true);
                            const reader = stream.body.getReader();
                            const td = new TextDecoder();
                            let done, value;
                            while (!done) {
                                ({ value, done } = await reader.read());
                                logsRef.current.innerText += td.decode(value);
                                logsRef.current.scrollTo(0, logsRef.current.scrollHeight);
                            }
                        }} type="button" className="btn btn-primary" data-bs-dismiss="modal">Generate</button>
                    </div>
                </div>
            </div>
        </div>
    </>
}
