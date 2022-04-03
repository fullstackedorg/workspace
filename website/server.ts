import Server, {publicDir} from "fullstacked/server";
import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";

const server = new Server();

server.express.use("/docs*", express.static(publicDir));

server.express.use("/coverage/badge.svg", async (req, res) => {
    const coverageIndexHTML = fs.readFileSync(path.resolve(__dirname, "public/coverage/index.html"), {encoding: "utf8"});
    const digitsSpan = coverageIndexHTML.match(/<span class="strong">.*<\/span>/g);
    const coverage = parseFloat(digitsSpan[0].slice(`<span class="strong">`.length, -`</span>`.length));

    let color;
    if(coverage === 1000)
        color = "brightgreen";
    else if(coverage > 90)
        color = "green";
    else if(coverage > 80)
        color = "yellowgreen"
    else if(coverage > 60)
        color = "yellow";
    else
        color = "red";

    const badge = await axios.get(`https://img.shields.io/badge/coverage-${coverage.toFixed(2)}%25-${color}`);
    res.set('Content-Type', 'image/svg+xml');
    res.send(badge.data);
});

server.express.get("/subscribe", async (req, res) => {
    const response = await axios
        .post("https://" + process.env.MAILING_URL + "/api/subscribers",{
            email: req.query.email,
            name: req.query.name,
            lists: [parseInt(process.env.MAILING_LIST_ID)]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' +
                    Buffer.from(process.env.MAILING_USER + ":" + process.env.MAILING_PASS).toString('base64')
            }
        });

    res.json({success: response.data.data});

});

server.start();
