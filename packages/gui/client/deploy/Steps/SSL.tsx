import React, {useEffect, useRef, useState} from "react";
import {Client} from "../../client";
import type {CertificateSSL} from "@fullstacked/deploy"
import type deploy from "../../../server/deploy";

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
]

const dateToHuman = (date: Date) => {
    const minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    const seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${date.getHours()}:${minutes}:${seconds}`;
}

export default function (){
    const [showNewCertForm, setShowNewCertForm] = useState(false);
    const [showManualCert, setShowManualCert] = useState(false);
    const [certificateSSL, setCertificateSSL] = useState<Awaited<ReturnType<typeof deploy.getCertificateSSL>>>(null);
    const [certificateData, setCertificateData] = useState<Awaited<ReturnType<typeof deploy.getCertificateData>>>(null);

    useEffect(() => {Client.get().deploy.getCertificateSSL().then(setCertificateSSL);}, []);
    useEffect(() => {
        Client.post().deploy.updateCertificateSSL(certificateSSL)
            .then(() => {Client.get().deploy.getCertificateData().then(setCertificateData)})
    }, [certificateSSL]);

    const domains = certificateData?.subjectAltName?.split(",").map(record => record.trim().substring("DNS:".length))

    return <div>
        <div className={"d-flex justify-content-between"}>
            <h4 className="card-title">Certificate</h4>
            <div>
                <div onClick={() => setShowManualCert(true)} className="btn btn-outline-secondary d-none d-sm-inline-block me-2">
                    Add manually
                </div>
                <div onClick={() => setShowNewCertForm(true)} className="btn btn-primary d-none d-sm-inline-block">
                    Create new
                </div>
            </div>
        </div>

        {certificateData
            ? (() => {
                const validTo = new Date(certificateData.validTo)
                const isExpired = validTo.getTime() < Date.now();
                return <div className="card">
                    <div className={`card-status-start ${isExpired ? "bg-danger" : "bg-success"}`}></div>
                    <div className="card-header">
                        <h3 className="card-title">Certificate</h3>
                        <div className={"card-actions"}>
                            <div className="btn btn-outline-danger me-2">
                                Delete
                            </div>
                            <div className="btn btn-primary">
                                Renew
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        <dl>
                            <div>
                                <dt>Common Name (CN)</dt>
                                <dd>{certificateData.subject.slice("CN=".length)}</dd>
                            </div>
                            <div>
                                <dt>Domains</dt>
                                <dd>{domains && domains
                                    ? domains.map(domain => <div>{domain}</div>)
                                    : "None"}</dd>
                            </div>

                        </dl>
                    </div>
                    <div className="card-footer">
                        {isExpired ? "Expired on " : "Valid until "}
                        {dateToHuman(validTo)}
                    </div>
                </div>
            })()
            : "No certificate installed"}

        {showNewCertForm && <NewCertForm
            close={() => setShowNewCertForm(false)}
            addNewCert={setCertificateSSL}
        />}

        {showManualCert && <ManualCertForm
            close={() => setShowManualCert(false)}
            addNewCert={setCertificateSSL}
        />}
    </div>
}


function NewCertForm({close, addNewCert} : {
    close: () => void,
    addNewCert: (certificate: CertificateSSL) => void
}){
    const [loading, setLoading] = useState(false);
    const [serverNames, setServerNames] = useState<string[]>(null);

    const emailRef = useRef<HTMLInputElement>();
    const serverNamesToInclude = new Set<string>();

    useEffect(() => {
        Client.get().deploy.getServices().then(nginxConfigs => {
            setServerNames(nginxConfigs.map(nginxConfig => nginxConfig.serverNames || []).flat());
        });
    }, []);

    return <>
        <div className="modal-backdrop fade show w-50" style={{bottom: 0, top: "unset", height: "calc(100vh - 166px)"}}></div>
        <div className="modal modal-blur fade show w-50 p-3"
             style={{display: "block", bottom: 0, top: "unset", height: "calc(100vh - 166px)"}}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">New Certificate</h5>
                        <button onClick={close} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input ref={emailRef} type="text" className="form-control" placeholder="Email" />
                        </div>
                        <div id="server-names-select" className="form-selectgroup form-selectgroup-boxes d-flex flex-column">
                            <label className="form-label">Domains</label>
                            {serverNames && serverNames.length
                                ? serverNames.map((serverName) =>
                                <label className="form-selectgroup-item flex-fill">
                                    <input type="checkbox" value={serverName} className="form-selectgroup-input"
                                           onChange={e => {
                                               if(e.currentTarget.checked)
                                                   serverNamesToInclude.add(serverName);
                                               else
                                                   serverNamesToInclude.delete(serverName);
                                           }}/>
                                    <div className="form-selectgroup-label d-flex align-items-center p-3">
                                        <div className="me-3">
                                            <span className="form-selectgroup-check"></span>
                                        </div>
                                        <div className="form-selectgroup-label-content d-flex align-items-center">
                                            <div>
                                                <div className="font-weight-medium">{serverName}</div>
                                            </div>
                                        </div>
                                    </div>
                                </label>)
                            : <div>No domain entered in configurations</div>}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div onClick={close} className="btn btn-link link-secondary" data-bs-dismiss="modal">
                            Cancel
                        </div>
                        <div onClick={async () => {
                            if(!emailRef.current?.value) return;

                            setLoading(true);
                            addNewCert(await Client.post().deploy.generateCertificateSSL(emailRef.current.value, Array.from(serverNamesToInclude)));
                            setLoading(false);
                            close();
                        }} className={`btn btn-primary ms-auto ${loading ? "disabled" : ""}`} data-bs-dismiss="modal">
                            {loading
                                ? <div className="spinner-border" role="status"></div>
                                : "Create new certificate"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
}

function ManualCertForm({close, addNewCert}: {
    close: () => void,
    addNewCert: (certificate: CertificateSSL) => void
}){
    const fullchainRef = useRef<HTMLTextAreaElement>();
    const privkeyRef = useRef<HTMLTextAreaElement>();

    return <>
        <div className="modal-backdrop fade show w-50" style={{bottom: 0, top: "unset", height: "calc(100vh - 166px)"}}></div>
        <div className="modal modal-blur fade show w-50 p-3"
             style={{display: "block", bottom: 0, top: "unset", height: "calc(100vh - 166px)"}}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">New Certificate</h5>
                        <button onClick={close} type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <label className="form-label">Fullchain</label>
                            <textarea ref={fullchainRef} className="form-control" rows={6}></textarea>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Privkey</label>
                            <textarea ref={privkeyRef} className="form-control" rows={6}></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <div onClick={close} className="btn btn-link link-secondary" data-bs-dismiss="modal">
                            Cancel
                        </div>
                        <div onClick={() => {
                            addNewCert({
                                fullchain: fullchainRef.current.value,
                                privkey: privkeyRef.current.value,
                            });
                            close();
                        }} className="btn btn-primary ms-auto" data-bs-dismiss="modal">
                            Add Certificate
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
}
