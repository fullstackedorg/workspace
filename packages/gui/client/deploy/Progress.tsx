import React from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {steps} from "./Steps";

export default function (){
    const location = useLocation();
    const navigate = useNavigate();

    let currentStepIndex = 0;
    steps.forEach((step, i) => {
        if(location.pathname.endsWith(step.slug))
            currentStepIndex = i
    });

    return <div className={"card"}>
        <ul className="steps steps-counter my-4">
            {steps.map((step, i) =>
                <li onClick={() => navigate(`/deploy${step.slug}`)}
                    className={`cursor-pointer step-item ${currentStepIndex === i ? "active" : ""}`}>
                    {step.title}
                </li>)}
        </ul>
    </div>
}
