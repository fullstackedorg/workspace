import GitHubButton from "react-github-btn";
import React, {useEffect} from "react";
import {closeConsole} from "./Console";

export default function (props: {command: string}) {
    useEffect(closeConsole, []);

    return <div className="container-xl d-flex flex-column justify-content-center">
        <div className="empty">
            <p className="empty-title">Not ready yet</p>
            <p className="empty-subtitle text-muted">
                We're working on making the {props.command} command available in the GUI.<br/>
                If you&nbsp;
                <svg xmlns="http://www.w3.org/2000/svg" className="text-danger icon icon-tabler icon-tabler-heart-filled"
                     width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none"
                     strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037 .033l.034 -.03a6 6 0 0 1 4.733 -1.44l.246 .036a6 6 0 0 1 3.364 10.008l-.18 .185l-.048 .041l-7.45 7.379a1 1 0 0 1 -1.313 .082l-.094 -.082l-7.493 -7.422a6 6 0 0 1 3.176 -10.215z"
                          strokeWidth="0" fill="currentColor"></path>
                </svg> FullStacked, please consider giving it a star&nbsp;
                <svg xmlns="http://www.w3.org/2000/svg" className="text-yellow icon icon-tabler icon-tabler-star-filled"
                     width="24" height="24" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" fill="none"
                     strokeLinecap="round" strokeLinejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                    <path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"
                          strokeWidth="0" fill="currentColor"></path>
                </svg><br />Support is always highly appreciated.
            </p>
            <GitHubButton href="https://github.com/cplepage/fullstacked"
                          data-icon="octicon-star" data-size="large" data-show-count="true"
                          aria-label="Star cplepage/fullstacked on GitHub">
                Star
            </GitHubButton>
        </div>
    </div>
}
