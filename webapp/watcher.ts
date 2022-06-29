let lastBuildTime, webSocket;
function connectWebsocket(){
    webSocket = new WebSocket('ws://' + window.location.hostname + ':8001');
    webSocket.onmessage = function(message){
        const buildTime = Number(message.data);
        if(!lastBuildTime){
            lastBuildTime = buildTime;
            return;
        }

        if(lastBuildTime < buildTime)
            window.location.reload();
    }
    webSocket.onclose = function(){
        document.body.innerText = "Lost watcher connection. Reload page...";
    }
}
connectWebsocket();
