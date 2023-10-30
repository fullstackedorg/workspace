import { readFileSync, watch, writeFileSync, existsSync, statSync } from "fs";
import http from "http";
import { WebSocketServer } from "ws";
import { parseFragment } from "parse5";
import * as sass from "sass";
import mime from "mime-types";
import esbuild from "esbuild";
import { buildHTMLPage } from "./html.js";

const server = http.createServer((req, res) => {
    const maybeFile = "." + decodeURIComponent(req.url.split("?").shift());
    if(existsSync(maybeFile) && statSync(maybeFile).isFile()){
        res.setHeader("content-type", mime.lookup(maybeFile));
        res.writeHead(200);
        res.end(readFileSync(maybeFile));
        return;
    }
    
    res.setHeader("content-type", "text/html");

    if(req.url.startsWith("/demo")){
        res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
        res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
        res.end(buildHTMLPage("demo/index.html"));
    }else
        res.end(buildHTMLPage("index.html", watchScript));
})
server.listen(8080);

console.log("Running at http://localhost:8080");


const clients = new Set();
const wss = new WebSocketServer({ noServer: true });
server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, ws => {
        wss.emit('connection', ws, req);
    });
});
wss.on("connection", ws => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
});

const compileStyle = () => {
    let css;
    try{
        css = sass.compile("index.scss").css;
    }catch(e){
        console.log(e)
        return;
    }
    writeFileSync("index.css", css);
};
compileStyle();
watch("index.scss", compileStyle);
watch("index.css", () => clients.forEach(ws => ws.send("style")));

watch("index.html", () => {
    clients.forEach(ws => ws.send("1"))
})

const watchScript = parseFragment(`
<script>
const ws = new WebSocket(\`ws\$\{ window.location.protocol === "https:" ? "s" : "" \}://\` + window.location.host);
ws.onmessage = (e) => {
    console.log(e);
    if(e.data === "style"){
        const style = document.querySelector("link");
        const newStyle = style.cloneNode();
        style.remove();
        newStyle.href = "/index.css?t=" + Date.now();
        document.head.append(newStyle);
    }else{
        window.location.reload()
    }
}
</script>`);

const ctx = await esbuild.context({
    entryPoints: ["script.ts"],
    outfile: "script.js",
    bundle: true
});

const ctx2 = await esbuild.context({
    entryPoints: ["demo/demo.ts"],
    outfile: "demo/demo.js",
    format: "esm",
    bundle: true
});

await ctx.watch()
await ctx2.watch()