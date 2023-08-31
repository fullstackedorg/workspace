function setTray() {
    if(NL_MODE != "window") {
        console.log("INFO: Tray menu is only available in the window mode.");
        return;
    }
    let tray = {
        icon: "/resources/icons/trayIcon.png",
        menuItems: [
            {id: "VERSION", text: "Get version"},
            {id: "SEP", text: "-"},
            {id: "QUIT", text: "Quit"}
        ]
    };
    Neutralino.os.setTray(tray);
}

function onTrayMenuItemClicked(event) {
    switch(event.detail.id) {
        case "VERSION":
            Neutralino.os.showMessageBox("Version information",
                `Neutralinojs server: v${NL_VERSION} | Neutralinojs client: v${NL_CVERSION}`);
            break;
        case "QUIT":
            onWindowClose()
            break;
    }
}

function onWindowClose() {
    Neutralino.os.updateSpawnedProcess(fullstackedProc.id, "exit", null);
    Neutralino.app.exit();
}

Neutralino.init();

function loadIframe(){
    console.log("ici")
    const image = document.querySelector("img");
    if(!image) return;
    setTimeout(() => {
        console.log("ici")
        const iframe = document.createElement("iframe");
        iframe.src = "http://localhost:8000";
        image.replaceWith(iframe);
    }, 2000);
}

let fullstackedProc;
Neutralino.events.on("ready", async () => {
    const spawnedProcess = await Neutralino.os.getSpawnedProcesses();
    if(spawnedProcess.length){
        fullstackedProc = spawnedProcess[spawnedProcess.length - 1];
        loadIframe();
        return;
    }

    fullstackedProc = await Neutralino.os.spawnProcess('node ../../index.js');

    Neutralino.events.on('spawnedProcess', (evt) => {
        if(fullstackedProc.id === evt.detail.id) {
            switch(evt.detail.action) {
                case 'stdOut':
                    console.log(evt.detail.data);
                    loadIframe();
                    break;
                case 'stdErr':
                    console.error(evt.detail.data);
                    break;
                case 'exit':
                    console.log(`Ping process terminated with exit code: ${evt.detail.data}`);
                    break;
            }
        }
    });
})

Neutralino.events.on("trayMenuItemClicked", onTrayMenuItemClicked);
Neutralino.events.on(`windowClose`, onWindowClose);

if(NL_OS != "Darwin") { // TODO: Fix https://github.com/neutralinojs/neutralinojs/issues/615
    setTray();
}

Neutralino.window.setTitle('FullStacked');
