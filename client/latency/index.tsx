import React, {useEffect, useState} from "react";
import {client} from "../client";
import { Workspace } from "../workspace";
import latencyIcon from "../icons/stopwatch.svg"

function Latency() {
    const [tests, setTests] = useState([]);
    const [avg, setAvg] = useState(null);

    useEffect(() => {
        if(tests.length === 10){
            setAvg(tests.reduce((tot, time) => tot + time, 0) / tests.length)
            return;
        }

        const start = performance.now();
        client.get().ping().then(response => {
            const result = performance.now() - start;
            setTests([...tests, result]);
        })
    }, [tests]);

    return <div style={{padding: 5, color: "white"}}>
        <div>Page load: {performance.timing.loadEventEnd - performance.timing.navigationStart}ms</div>
        <hr />
        {tests.map(test => <div>
            Response time: {test.toFixed(2)}ms
        </div>)}
        <hr />
        {avg && <div>
            Average ping time: {avg.toFixed(2)}ms
        </div>}
    </div>
}

Workspace.addApp({
    title: "Latency",
    icon: latencyIcon,
    order: 10,
    element: () => <Latency />
})
