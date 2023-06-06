import {useLocation, useNavigate} from "react-router-dom";
import React from "react";
import {steps} from "./Steps";

export default function () {
    const location = useLocation();
    const navigate = useNavigate();

    const currentPath = location.pathname.slice("/deploy".length);

    const stepIndex = steps.map((step) => step.slug).indexOf(currentPath);


    return <div className={"d-flex justify-content-between mt-3"}>
        {stepIndex !== 0
            ? <div onClick={() => navigate("/deploy" + steps.at(stepIndex - 1).slug)}
                   className="btn btn-outline-secondary">Previous</div>
            : <div />}

        {stepIndex !== steps.length - 1
            && <div onClick={() => navigate("/deploy" + steps.at(stepIndex + 1).slug)}
                    className="btn btn-primary">Next</div>}
    </div>
}
