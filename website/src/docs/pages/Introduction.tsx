import React from "react";
import {Container} from "react-bootstrap";

export default function(){
    return <Container>
        <h1>Introduction</h1>
        <div className={"box p-4 my-4"}>
            This is the first version of FullStacked's documentation and references. The project is still in very early phase
            so please be kind. If you have an unresolved or undocumented issue, I will try to responds as fast as possible to
            every Github issue. This is an open source and very open to collaboration project! Feel free to fork and submit
            pull requests! Have Fun!
        </div>
        <h3>Welcome to FullStacked!</h3>
        <p>
            FullStacked is a npm package that helps with all the development setup for a webapp built with
            typescript. You can skip most of the setup phase of a typical project to rapidly start developing!
        </p>
        <h3>Concept</h3>
        <p>
            The idea is to provide all the setup needed for the development of a complete webapp. In line with that, simple
            commands allows to have everything up and running in a record time. No need to think about environments, watcher
            tools or npm scripts to achieve your configuration.
        </p>
        <h3>Requirements</h3>
        <p>
            The only thing you need is <a href={"https://nodejs.org/"} target={"_blank"}>NodeJS</a> and npm which comes together.
            It hasn't been tested with all versions, but anything <span className={"code"}>&gt;= 14.14</span> should be all good.
            Install it from the <a href={"https://nodejs.org/en/download/"} target={"_blank"}>official download page</a>.
        </p>

    </Container>
}
