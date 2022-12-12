import {fetch} from "fullstacked/webapp/fetch";
import React from "react";

export default function ({baseUrl, loadData}){
    return <div>
        <p>
            You have saved configs, enter password to load them.
        </p>
        <form onSubmit={async e => {
            e.preventDefault();
            const configs = await fetch.post(`${baseUrl}/load`, {password: (document.querySelector("#config-pass") as HTMLInputElement).value});
            loadData(configs);
        }}>
            <div className="mb-3">
                <label className="form-label">Password</label>
                <input id="config-pass" type="password" className="form-control" name="example-password-input" placeholder="********" />
            </div>
            <div className={"d-flex justify-content-between"}>
                <div onClick={() => loadData({})} className="cursor-pointer btn btn-outline-secondary">
                    Start Over
                </div>
                <button className="cursor-pointer btn btn-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-upload" width="24"
                         height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                         stroke-linecap="round" stroke-linejoin="round">
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
