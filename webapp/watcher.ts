import waitForServer from "../scripts/waitForServer";

let webSocket;

const warningContainer = document.createElement("div");
warningContainer.style.cssText = `
    background-color: rgb(217 81 81 / 60%);
    color: white;
    position: fixed;
    z-index: 9999999;
    bottom: 0;
    right: 0;
    padding: 12px 18px;
    font-family: sans-serif;
`;
warningContainer.innerText = "Lost watcher connection...";

async function connectWebsocket(){
    await waitForServer(3000, window.location.origin);
    warningContainer.remove();
    webSocket = new WebSocket((window.location.protocol === "https:" ? "wss:" : "ws:") + "//" +
        window.location.host + "/watcher");
    webSocket.onmessage = () => window.location.reload();
    webSocket.onclose = function(){
        document.body.append(warningContainer);
        connectWebsocket();
    }
}
connectWebsocket();
