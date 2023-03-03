const storageKey = "watcherEndpoint";

const watcherEndpoint = window.localStorage.getItem(storageKey);

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
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
`;
overlay.innerText = "Waiting for Web App reboot...";

async function reload(){
    document.body.append(overlay);
    let caughtServerDown = false;
    let serverBackUp = false;
    while (!serverBackUp){
        try{
            await fetch("/");
            if(caughtServerDown)
                serverBackUp = true;
        }
        catch (e) {
            caughtServerDown = true;
            await sleep(100);
        }
    }
    window.location.reload();
}

function connectToWatcher(host: string){
    const ws = new WebSocket((window.location.protocol === "https:" ? "wss:" : "ws:") + "//" + host);
    ws.onmessage = reload;
}

if(!watcherEndpoint){
    const form = document.createElement("form");
    const input = document.createElement("input");
    form.addEventListener("submit", e => {
        e.preventDefault();
        let value = input.value;
        if(!value.startsWith("http"))
            value = window.location.protocol + "//" + value;
        const url = new URL(value);
        connectToWatcher(url.host);
        window.localStorage.setItem(storageKey, url.host);
    });
    form.append(input);
    document.body.append(form);
}else{
    connectToWatcher(watcherEndpoint)
}
