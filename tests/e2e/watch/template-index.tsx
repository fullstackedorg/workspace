import webapp from "fullstacked/webapp";

const key = "reloadCount";
const reloadCountStr = window.localStorage.getItem(key);
const reloadCount = reloadCountStr ? Number(reloadCountStr) : 0;

webapp(<>
    <div id={"reloadCount"}>{reloadCount}</div>
    <div id={"bootTime"} />
</>);

window.localStorage.setItem(key, (reloadCount + 1).toString());

let lastBootTime = 0;
setInterval(() => {
    fetch("/bootTime")
        .then(res => res.json())
        .then(timestamp => {
            if(lastBootTime !== timestamp)
                document.getElementById("bootTime").innerText = timestamp.toString();
            lastBootTime = timestamp;
        });
}, 500);
