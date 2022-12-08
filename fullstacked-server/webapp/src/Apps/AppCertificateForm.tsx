import React, {useRef, useState} from "react";

export default function ({appID, onClose}){
    const [showLogs, setShowLogs] = useState(true);
    const logsRef = useRef();
    const emailRef = useRef();

    if(!appID) return <></>

    return <>
        <div className={`modal-backdrop fade show`}></div>
        <div className={`modal modal-blur fade show`} id="modal-team" tabIndex="-1" role="dialog" aria-modal="true"
             style={{display: "block"}}>
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Generate SSL certificates for {appID}</h5>
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
                        <button onClick={onClose} type="button" className="btn me-auto" data-bs-dismiss="modal">Cancel</button>
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
