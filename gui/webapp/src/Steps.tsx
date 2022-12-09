import React from "react";
import {steps} from "./App";

export default function ({stepIndex}){
    return <div className={"card"}>
        <ul className="steps steps-counter my-4">
            {steps.map((step, index) =>
                <li className={`step-item ${stepIndex === index ? "active" : ""}`}>{step.title}</li>)}
        </ul>
    </div>
}
