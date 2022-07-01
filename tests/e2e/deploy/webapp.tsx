import webapp from "fullstacked/webapp";

webapp(<>
    <h1>Deploy Test</h1>
    <div id={"version"}>{process.env.VERSION}</div>
</>);
