import Server, {publicDir} from "fullstacked/server";
import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";

const server = new Server();

server.express.use("/docs*", express.static(publicDir));

server.express.get("/coverage/badge.svg", async (req, res) => {
    const coverageFile = path.resolve(__dirname, "public/coverage/index.html");
    let coverage = 0;
    if(fs.existsSync(coverageFile)){
        const coverageIndexHTML = fs.readFileSync(coverageFile, {encoding: "utf8"});
        const digitsSpan = coverageIndexHTML.match(/<span class="strong">.*<\/span>/g);
        coverage = parseFloat(digitsSpan[0].slice(`<span class="strong">`.length, -`</span>`.length));
    }

    let color;
    if(coverage > 98)
        color = "brightgreen";
    else if(coverage > 90)
        color = "green";
    else if(coverage > 80)
        color = "yellowgreen"
    else if(coverage > 60)
        color = "yellow";
    else
        color = "red";

    res.set('Content-Type', 'image/svg+xml');
    const badge = await axios.get(`https://img.shields.io/badge/coverage-${coverage.toFixed(2)}%25-${color}`,
        {responseType: 'stream'});
    badge.data.pipe(res);
});

server.express.get("/version/badge.svg", async (req, res) => {
    const npmJSData = (await axios.get("https://registry.npmjs.org/fullstacked")).data;
    const lastVersion = Object.keys(npmJSData.time).pop();

    res.set('Content-Type', 'image/svg+xml');
    const badge = await axios.get(`https://img.shields.io/badge/version-${lastVersion}-05afdd`,
        {responseType: 'stream'});
    badge.data.pipe(res);
})

server.express.get("/dependencies/badge.svg", async (req, res) => {
    const npmJSData = (await axios.get("https://registry.npmjs.org/fullstacked")).data;
    const lastVersion = Object.keys(npmJSData.time).pop();
    const dependencies = npmJSData.versions[lastVersion].dependencies;
    console.log(dependencies)

    res.set('Content-Type', 'image/svg+xml');
    const badge = await axios.get(`https://img.shields.io/badge/dependencies-${Object.keys(dependencies).length}-782175`,
        {responseType: 'stream'});
    badge.data.pipe(res);
})

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
