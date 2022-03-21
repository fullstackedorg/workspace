const child_process = require("child_process");
const path = require("path");
const superagent = require("superagent");
const fs = require("fs");

console.log(child_process.execSync(`fullstacked --src=${__dirname}`).toString());

setTimeout(async () => {
    const server = child_process.exec("node " + path.resolve(process.cwd(), "dist/index.js"));
    setTimeout(async () => {
        const response = await superagent
            .get("http://localhost:8000");

        if(response.text !== fs.readFileSync(path.resolve(process.cwd(), "dist/public/index.html"), {encoding: "utf-8"}))
            throw new Error("Response is not equal to public html");

        server.kill();
    }, 1000);
}, 1000);
