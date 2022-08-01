let webSocket;
function connectWebsocket(){
    webSocket = new WebSocket('ws://' + window.location.hostname + ':8001');
    webSocket.onmessage = (message) => window.location.reload();
    webSocket.onclose = function(){
        document.body.innerText = "Lost watcher connection. Reload page...";
    }
}
connectWebsocket();
