import React, {useState, useEffect} from "react";
import {fetch} from "../../../../webapp/fetch"

const tests = new Map();
const testUrl = (baseUrl, url, retry = false) => {
    let test = tests.get(url);

    if(!test || retry) {
        test = fetch.post(`${baseUrl}/test`, {url});
        tests.set(url, test)
    }

    return test;
}

export default function ({baseUrl, getSteps}){
    const [testsResults, setTestsResults] = useState({});

    const serverNames = getSteps().at(1)?.data?.nginxConfigs?.map(service => service.server_names).flat();

    useEffect(() => {
        serverNames.forEach(url => {
            testUrl(baseUrl, url).then(testResult => {
                setTestsResults(prevState => ({
                    ...prevState,
                    [url]: testResult
                }))
            })
        })
    }, []);

    console.log(testsResults);

    return <div>
        <div className={"card"}>
            <table className="table table-vcenter card-table">
                <thead>
                <tr>
                    <th>Server Name</th>
                    <th className={"text-center"}>http status</th>
                    <th className={"text-center"}>https status</th>
                    <th className={"text-center"}>Retry Test</th>
                </tr>
                </thead>
                <tbody>
                {serverNames.map(serverName => {
                    const testResult = testsResults[serverName];

                    return <tr>
                        <td>{serverName}</td>
                        <td className={"text-center"}>
                            {testResult
                                ? testResult.http
                                    ? <span className="badge bg-success"></span>
                                    : <span className="badge bg-danger"></span>
                                : <div className="spinner-border" role="status"></div>}
                        </td>
                        <td className={"text-center"}>
                            {testResult
                                ? testResult.https
                                    ? <span className="badge bg-success"></span>
                                    : <span className="badge bg-danger"></span>
                                : <div className="spinner-border" role="status"></div>}
                        </td>
                        <td className={"text-center"}>
                            <div className="btn btn-primary" onClick={async () => {
                                setTestsResults(prevState => ({
                                    ...prevState,
                                    [serverName]: null
                                }));
                                const testResult = await testUrl(baseUrl, serverName, true);
                                setTestsResults(prevState => ({
                                    ...prevState,
                                    [serverName]: testResult
                                }))
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                     className="m-0 icon icon-tabler icon-tabler-refresh"
                                     width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                     fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                    <path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"></path>
                                    <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path>
                                </svg>
                            </div>
                        </td>
                    </tr>
                })}
                </tbody>
            </table>
        </div>



        <h4 className="card-title">Certificates</h4>
    </div>
}
