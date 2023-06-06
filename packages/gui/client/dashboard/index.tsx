import React, {useEffect, useState} from "react";
import {Client} from "../client";
import {useNavigate} from "react-router-dom";
import {closeConsole} from "../Console";
import useAPI from "@fullstacked/webapp/client/react/useAPI";

export default function () {
    const navigate = useNavigate();
    const [commands] = useAPI(Client.get().installedCommand);

    useEffect(closeConsole, []);

    return <div className={"container-xl"}>
        <div className={"page-header"}>
            <div className="page-pretitle">Dashboard</div>
            <h2 className={"page-title"}>Commands</h2>
        </div>

        <div className={"page-body"}>
            <div className={"card card-responsive"}>
                <table className="table table-vcenter table-mobile-md card-table">
                    <thead>
                    <tr>
                        <th>Command</th>
                        <th className={"text-center"}>Installed</th>
                        <th>Version</th>
                        <th>Description</th>
                        <th>Links</th>
                    </tr>
                    </thead>
                    <tbody>
                    {commands?.map(command => command.name === "gui" ? <></> : <tr>
                        <td>
                            <div className="d-flex py-1 align-items-center">
                                <div className="font-weight-medium">{command.name}</div>
                            </div>
                        </td>
                        <td className={"text-center"}>
                            {command.installed
                                ? <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-check text-success"
                                       width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor"
                                       fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                    <path d="M5 12l5 5l10 -10"></path>
                                </svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-x text-danger"
                                       width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor"
                                       fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                    <path d="M18 6l-12 12"></path>
                                    <path d="M6 6l12 12"></path>
                                </svg>
                            }
                        </td>
                        <td className="text-muted">
                            {command.version}
                        </td>
                        <td className="text-muted">
                            {command.description}
                        </td>
                        <td>
                            <div className="btn-list flex-nowrap">
                                <div onClick={() => navigate(`/${command.name}`)}
                                     className={`btn btn-primary ${command.installed ? "" : "disabled"}`}>
                                    Start
                                </div>
                                <a href={`https://www.npmjs.com/package/@fullstacked/${command.name}`} target="_blank" className="btn">
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                         width="24" height="24" style={{color: "#CC3534", height: 24, width: 24}}
                                         viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none"
                                         strokeLinecap="round" strokeLinejoin="round"
                                         className="icon icon-tabler icon-tabler-brand-npm">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                        <path d="M1 8h22v7h-12v2h-4v-2h-6z"></path>
                                        <path d="M7 8v7"></path>
                                        <path d="M14 8v7"></path>
                                        <path d="M17 11v4"></path>
                                        <path d="M4 11v4"></path>
                                        <path d="M11 11v1"></path>
                                        <path d="M20 11v4"></path>
                                    </svg>
                                    View on npm
                                </a>
                            </div>
                        </td>
                    </tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
}
