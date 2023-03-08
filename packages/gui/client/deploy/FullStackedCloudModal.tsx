import React, {useEffect, useRef} from "react";

export default function ({didReceiveServerInstance, close}) {
    const iframeRef = useRef<HTMLIFrameElement>();

    useEffect(() => {
        window.addEventListener('message', message => {
            if(!message.data) return;
            didReceiveServerInstance(message.data);
        });
    }, [])

    return <>
            <div className={`modal-backdrop fade show`}></div>
            <div className={`modal modal-blur fade show`} tabIndex={-1}
                    style={{display: "block", paddingLeft: 0}} aria-modal="true" role="dialog">
            <div style={{height: "100%"}} className="modal-dialog modal-full-width modal-dialog-centered justify-content-center" role="document">
                <div className="modal-content" style={{height: "calc(100vh - 2 * var(--tblr-modal-margin))", maxWidth: 1050}}>
                    <div className="modal-header">
                        <h5 className="modal-title">Use FullStacked Cloud for your deployment</h5>
                        <button onClick={close} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <iframe ref={iframeRef} style={{
                            height: "100%",
                            width: "100%"
                        }} src={"https://fullstacked.cloud"} />
                    </div>
                    <div className="modal-footer">
                        <div onClick={close} className="btn btn-link link-secondary" data-bs-dismiss="modal">
                            Don't show me again
                        </div>
                        <div onClick={close} className="btn btn-primary ms-auto" data-bs-dismiss="modal">
                            Close
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
}
