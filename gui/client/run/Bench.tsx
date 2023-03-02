import React, {useRef, useState} from "react";
import {WS} from "../WebSocket";
import {RUN_CMD} from "../../../types/run";

async function testEndpoint(url, totalReqsCount, cb){
    let tests = [];
    while(tests.length < totalReqsCount){
        tests.push(await WS.cmd(RUN_CMD.BENCH, {url}));
        cb(tests);
    }
}

export default function () {
    const inputURLRef = useRef<HTMLInputElement>();
    const testCountRef = useRef<HTMLInputElement>();
    const [testsResult, setTestsResults] = useState(null);

    const calcTestsResults = (tests) => {
        setTestsResults({
            min: Math.min(...tests),
            max: Math.max(...tests),
            avg: tests.reduce((total, test) => total + test, 0) / tests.length,
            count: tests.length
        });
    }

    return <div>
        <div className={"row mb-2"}>
            <div className={"col-8"}>
                <label className="form-label">Endpoint</label>
                <input ref={inputURLRef} type="text" className="form-control"  placeholder="http://localhost:8000" />
            </div>
            <div className={"col-4"}>
                <label className="form-label">Requests Amount</label>
                <input ref={testCountRef} type="text" className="form-control"  placeholder="100" />
            </div>
        </div>

        <div onClick={() => testEndpoint(inputURLRef.current.value, parseInt(testCountRef.current.value), calcTestsResults)} className="btn btn-primary w-100">
            Launch Test
        </div>

        {testsResult &&
            <div className={"row mt-2"}>
                <div className={"col"}>min: {testsResult.min}ms</div>
                <div className={"col"}>max: {testsResult.max}ms</div>
                <div className={"col"}>average: {testsResult.avg.toFixed(3)}ms</div>
                <div className={"col"}>count: {testsResult.count}</div>
            </div>}
    </div>
}
