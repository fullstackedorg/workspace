import { WebContainer } from '@webcontainer/api';
import { Terminal as Xterm } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
import "xterm/css/xterm.css";

const xterm = new Xterm();
const fitAddon = new FitAddon();

xterm.loadAddon(fitAddon);
xterm.open(document.querySelector('body'));
window.addEventListener("resize", () => {
    fitAddon.fit();
});
setTimeout(() => {
    fitAddon.fit();
}, 100);

const webContainer = await WebContainer.boot();

const installCommand = [
    "i",
    "fullstacked"
]
xterm.write(`\r\nnpm ${installCommand.join(" ")}\r\n`);
const installProcess = await webContainer.spawn('npm', installCommand);

installProcess.output.pipeTo(new WritableStream({
    write(data) {
        xterm.write(data);
    }
}));

await installProcess.exit;

await webContainer.fs.mkdir("node_modules/fullstacked/dist/server/html")
await webContainer.fs.writeFile("node_modules/fullstacked/dist/server/html/injection.html", `<script>
(async () => {
    while(!window.Workspace){
        await new Promise(res => setTimeout(res, 100));
    }
    
    window.Workspace.addApp({
        icon: "https://files.fullstacked.org/app-icon.png",
        order: 100,
        title: "Website",
        element: (app) => {
            window.open("https://fullstacked.org")
            window.Workspace.instance.removeWindow(app);
        }
    });
    
    window.Workspace.addApp({
        icon: "https://files.fullstacked.org/x-logo.svg",
        order:99,
        title: "Share",
        element: (app) => {
            window.open("https://twitter.com/intent/tweet?text=${encodeURIComponent(`Try the FullStacked Demo!\n\nhttps://fullstacked.org/demo/`)}")
            window.Workspace.instance.removeWindow(app);
        }
    });
    
    window.Workspace.addApp({
        icon: "https://files.fullstacked.org/feedback.svg",
        order: 98,
        title: "Feedback",
        element: (app) => {
            window.open("https://tally.so/r/npyYkP")
            window.Workspace.instance.removeWindow(app);
        }
    });
})()
</script>`);

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
