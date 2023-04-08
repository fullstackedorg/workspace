import React, {useRef, useState} from "react";
import {Client} from "../../client";

export default function () {
    const [saving, setSaving] = useState(false);
    const [didSave, setDidSave] = useState(false);

    const passRef = useRef<HTMLInputElement>();
    return <div>
        <p>
            Save your current configurations to your project.
        </p>
        <form onSubmit={async e => {
            e.preventDefault();
            setSaving(true);
            await Client.post().deploy.saveConfig(passRef.current.value);
            setSaving(false);
            setDidSave(true);
        }}>
            <div className="mb-3">
                <label className="form-label">Password</label>
                <input ref={passRef} type="password" className="form-control" placeholder="********" />
            </div>
            <div className={"d-flex justify-content-end"}>
                <button className={`cursor-pointer btn ${didSave ? "btn-success" : "btn-primary"}`}>
                    {didSave
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="m-0 icon icon-tabler icon-tabler-check" width="24"
                               height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                               strokeLinecap="round" strokeLinejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                            <path d="M5 12l5 5l10 -10"></path>
                        </svg>
                        : saving
                            ? <div className="spinner-border" role="status"></div>
                            : <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-download" width="24"
                                     height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                     strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
                                    <polyline points="7 11 12 16 17 11"></polyline>
                                    <line x1="12" y1="4" x2="12" y2="16"></line>
                                </svg>
                                Save to project
                            </>}
                </button>
            </div>
        </form>
    </div>
}
