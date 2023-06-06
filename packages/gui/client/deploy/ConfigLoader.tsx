import React, {useRef} from "react";
import {Client} from "../client";

export default function ({didLoadConfig, pass}) {
    const passRef = useRef<HTMLInputElement>();

    return <div>
        <p>
            You have saved configs{pass && ", enter password to load them."}
        </p>
        <form onSubmit={async e => {
            e.preventDefault();
            await Client.get().deploy.loadConfig(passRef.current?.value ?? "")
            didLoadConfig();
        }}>
            {pass && <div className="mb-3">
                <label className="form-label">Password</label>
                <input ref={passRef} type="password" className="form-control" name="example-password-input" placeholder="********" />
            </div>}
            <div className={"d-flex justify-content-between"}>
                <div onClick={didLoadConfig} className="cursor-pointer btn btn-outline-secondary">
                    Start Over
                </div>
                <button className="cursor-pointer btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-upload" width="24"
                         height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                         strokeLinecap="round" strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
                        <polyline points="7 9 12 4 17 9"></polyline>
                        <line x1="12" y1="4" x2="12" y2="16"></line>
                    </svg>
                    Load Configs
                </button>
            </div>
        </form>
    </div>
}
