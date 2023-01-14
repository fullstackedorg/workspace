import React, {useEffect, useRef, useState} from "react";

export default function ({didReceiveServerInstance}) {
    const [show, setShow] = useState(true);
    const iframeRef = useRef<HTMLIFrameElement>();

    useEffect(() => {
        window.addEventListener('message', message => {
            if(!message.data) return
            setShow(false);
            didReceiveServerInstance(message.data);
        });
    }, [])

    return <>
            <div className={`modal-backdrop fade ${show ? "show" : "d-none"}`}></div>
            <div className={`modal modal-blur fade ${show ? "show" : "d-none"}`} tabIndex={-1}
                    style={{display: "block", paddingLeft: 0}} aria-modal="true" role="dialog">
            <div style={{height: "calc(100vh - 2 * var(--tblr-modal-margin))"}} className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content" style={{height: "calc(100vh - 2 * var(--tblr-modal-margin))"}}>
                    <div className="modal-header">
                        <h5 className="modal-title">Support FullStacked with your deployment</h5>
                        <button onClick={() => {setShow(false)}} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <iframe ref={iframeRef} style={{
                            height: "100%",
                            width: "100%"
                        }} src={"http://localhost:8000"} />
                    </div>
                    <div className="modal-footer">
                        <div onClick={() => {setShow(false)}} className="btn btn-link link-secondary" data-bs-dismiss="modal">
                            Don't show me again
                        </div>
                        <div onClick={() => {setShow(false)}} className="btn btn-primary ms-auto" data-bs-dismiss="modal">
                            Close
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
}
