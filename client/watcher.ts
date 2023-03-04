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
    try{
        const ws = new WebSocket((window.location.protocol === "https:" ? "wss:" : "ws:") + "//" + host);
        ws.onmessage = reload;
    }catch (e){
        this.displayForm();
    }
}

function displayForm(){
    const form = document.createElement("form");
    const input = document.createElement("input");
    form.addEventListener("submit", e => {
        e.preventDefault();
        let value = input.value;
        if(!value.startsWith("http"))
            value = window.location.protocol + "//" + value;
        const url = new URL(value);
        window.localStorage.setItem(storageKey, url.host);
        window.location.reload();
    });
    form.append(input);
    overlay.innerHTML = `<div>Enter FullStacked Watcher WebSocket Server Endpoint</div>`;
    overlay.append(form);
    document.body.append(overlay);
}

if(!watcherEndpoint){
    displayForm();
}else{
    connectToWatcher(watcherEndpoint)
}
