import { WebContainer } from '@webcontainer/api';
import { Terminal as Xterm } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
import "xterm/css/xterm.css";

const xterm = new Xterm();
const fitAddon = new FitAddon();

xterm.loadAddon(fitAddon);
xterm.open(document.querySelector('body'));
fitAddon.fit();
window.addEventListener("resize", () => {
    fitAddon.fit();
});

const webContainer = await WebContainer.boot();

const installCommand = [
    "i",
    "fullstacked@alpha"
]
xterm.write(`\r\nnpm ${installCommand.join(" ")}\r\n`);
const installProcess = await webContainer.spawn('npm', installCommand);

installProcess.output.pipeTo(new WritableStream({
    write(data) {
        xterm.write(data);
    }
}));

await installProcess.exit;

webContainer.on('server-ready', (port, url) => {
    if(port === 8000) {
        document.querySelector('.terminal').remove();
        const iframe = document.createElement("iframe");
        document.body.appendChild(iframe);
        iframe.src = url;
        iframe.style.display = "block";
    }
});

const runProcess = await webContainer.spawn('fullstacked');

runProcess.output.pipeTo(new WritableStream({
    write(data) {
        xterm.write(data);
    }
}));