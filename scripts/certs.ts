import {FullStackedConfig} from "../index";
import {askQuestion, execSSH, getSFTPClient, printLine} from "./utils";
import glob from "glob";
import path from "path";
import fs from "fs";
import Docker from "./docker";
import axios from "axios";
import {X509Certificate} from "crypto";
import {uploadFullStackedNginx} from "./deploy";

function compareArrays(arr1, arr2){
    if(arr1.length !== arr2.length) return false;

    arr1.sort();
    arr2.sort();

    for(let i = 0; i < arr1.length; i++){
        if(arr1[i] !== arr2[i]) return false;
    }
    return true;
}

export default async function(config: FullStackedConfig){
    const host = config.host;

    if(!host) return console.error("Missing host");
    if(!config.domain) return console.error("Missing domain");

    const hostnames = Array.isArray(config.domain) ? config.domain : [config.domain];
    const primaryHostname = hostnames[0];

    const sftp = await getSFTPClient(config);

    // make sure docker is ready
    await Docker(sftp)

    const serverAppDirectory = config.appDir + "/" + config.name;

    const certsDir = serverAppDirectory + "/certs/" + primaryHostname;
    const certsDirExists = await sftp.exists(certsDir);

    if(!certsDirExists){
        await uploadFullStackedNginx(sftp, config);

        console.log("\nStarting FullStacked Nginx");
        await execSSH(sftp.client, `docker-compose -p fullstacked-nginx -f ${config.appDir}/docker-compose.yml up -d`);

        for(const hostname of hostnames){
            const url = "http://" + hostname;
            console.log("Testing " + url);

            let res, success = true;
            try{
                res = await axios.get(url, {timeout: 2000});
                success = res.data === fs.readFileSync(path.resolve(__dirname, "..", "nginx", "html", "index.html"), {encoding: "utf-8"});
            }catch (e){
                success = false;
            }

            if(!success){
                console.error(hostname + " does not reach remote host. Make sure to add an A record pointing to " + config.host);
                await sftp.end();
                return process.exit(1);
            }
        }

        const email = config.email || await askQuestion("Please enter your email for certificate generation\n");

        const certbotCMD = [
            "docker run --rm --name certbot",
            `-v ${config.appDir}/html:/html`,
            `-v ${serverAppDirectory}/certs:/etc/letsencrypt/archive`,
            `certbot/certbot certonly --webroot --agree-tos --no-eff-email -m ${email} -w /html`,
            hostnames.map(hostname => `-d ${hostname}`).join(" ")
        ]

        console.log("Generating certificate with certbot");
        await execSSH(sftp.client, certbotCMD.join(" "));

    }else{
        const fullchain = await sftp.get(certsDir + "/fullchain1.pem");
        const cert = new X509Certificate(fullchain);

        // less than a month
        const needsRenewal = (new Date(cert.validTo).getTime() - Date.now()) < 1000 * 60 * 60 * 24 * 30;

        // TODO
        if(needsRenewal){
            console.log("SSL certificates needs renewal");
        }

        const domains = cert.subjectAltName.split(",").map(record => record.trim().substring("DNS:".length));
        if(!compareArrays(hostnames, domains)){
            console.error("Certificate domains does not match provided hostnames", domains, hostnames);
            await sftp.end();

            // TODO: Renew here too

            return process.exit(1);
        }
    }

    await sftp.end();
}

/*
* /{APP_DIR}
* ├── docker-compose.yml
* ├── nginx.conf
* ├── /html
* │   └── index.html
* └── /{APP_NAME}
*     ├── docker-compose.yml
*     ├── nginx.conf
*     ├── /certs
*     │   └── /example.com
*     │       ├── fullchain1.pem
*     │       └── privkey.pem
*     └── /0.0.0
*         ├── /public
*         │   ├── index.html
*         │   └── index.js
*         └── /index.js
*/

//
// docker run -it --rm --name certbot \
//             -v "/home/ec2-user/html:/html" \
//             -v "/home/ec2-user/test/certs:/etc/letsencrypt/archive" \
//             certbot/certbot certonly --webroot --agree-tos --no-eff-email -m lepage.charlesphilippe@gmail.com -w /html -d test3.fullstacked.cloud
//
// npm run build && node cli certs --host=99.79.60.85 --email=lepage.charlesphilippe@gmail.com --app-dir=/home/ec2-user --user=ec2-user --private-key-file=./key.pem --domain=test.fullstacked.cloud --app-dir=/home/ec2-user
