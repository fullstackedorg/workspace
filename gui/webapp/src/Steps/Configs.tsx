import React from "react";

export default function (){
    return <div>
        <div className="card">
            <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs nav-fill" data-bs-toggle="tabs" role="tablist">
                    <li className="nav-item" role="presentation">
                        <div className="nav-link active" data-bs-toggle="tab" aria-selected="true" role="tab">node</div>
                    </li>
                </ul>
            </div>
            <div className="card-body">
                <div className="tab-content">
                    <div className="tab-pane active show" id="tabs-home-11" role="tabpanel">
                        <div>
                            <label className="form-label">Server Name</label>
                            <input type="text" className="form-control" placeholder="foo.example.com" />
                        </div>
                        <div className={"text-center mt-1"}>
                            <div className="btn btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" className="m-0 icon icon-tabler icon-tabler-plus" width="24"
                                     height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                                     strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Nginx Extra Configs</label>
                            <textarea className="form-control" name="example-textarea-input" rows="6" placeholder="proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;"></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
}
