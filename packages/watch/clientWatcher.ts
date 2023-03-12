const storageKey = "watcherEndpoint";

function sleep(ms: number){
    return new Promise<void>(resolve => {
        setTimeout(resolve, ms);
    });
}

const overlay = document.createElement("div");
overlay.style.cssText = `
    font-family: sans-serif;
    color: white;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    z-index: 999999;
    background-color: rgba(30, 41, 59, 0.6);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

async function reload(){
    overlay.innerText = "Waiting for Web App reboot...";
    document.body.append(overlay);
    let caughtServerDown = false;
    let serverBackUp = false;
    while (!serverBackUp){
        const serverIsDown = (await fetch("/")).status === 500;
        if(!caughtServerDown && serverIsDown)
            caughtServerDown = true;
        else if(caughtServerDown && !serverIsDown) {
            serverBackUp = true;
            break;
        }
        await sleep(200);
    }
    window.location.reload();
}

function connectToWatcher(host: string){
    const ws = new WebSocket((window.location.protocol === "https:" ? "wss:" : "ws:") + "//" + host + "/fullstacked-ws");
    ws.onmessage = reload;
}

connectToWatcher(window.location.host)
