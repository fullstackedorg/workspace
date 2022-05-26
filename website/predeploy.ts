import {execSSH, sleep} from "../scripts/utils";
import SFTP from "ssh2-sftp-client";
import fs from "fs";
import path from "path";

export default async function (config: Config, sftp: SFTP) {
    const isListmonkVolumePresent = await execSSH(sftp.client, "docker volume ls -q | grep fullstacked_listmonk");
    if(isListmonkVolumePresent) {
        console.log("listmonk is already installed");
        return;
    }

    console.log("Setting up listmonk");

    require('dotenv').config();

    const mailingUser = process.env.MAILING_USER;
    const mailingPass = process.env.MAILING_PASS;
    const mailingServerName = process.env.MAILING_SERVER_NAME;

    if(!mailingUser || !mailingPass)
        throw new Error("Missing env file with mailing credentials");

    const listmonkConfigOutFile = config.out + "/config.toml";
    fs.copyFileSync(path.resolve(__dirname, "config.toml"), listmonkConfigOutFile);
    fs.appendFileSync(listmonkConfigOutFile, `\r\nadmin_username="${mailingUser}"`);
    fs.appendFileSync(listmonkConfigOutFile, `\r\nadmin_password="${mailingPass}"`);

    const serverPath = config.appDir + "/" + config.name ;

    if(!await sftp.exists(serverPath))
        await sftp.mkdir(serverPath, true);

    const serverDockerCompose = serverPath + "/docker-compose.yml";

    await sftp.put(config.out + "/docker-compose.yml", serverDockerCompose);
    await sftp.put(listmonkConfigOutFile, serverPath + "/config.toml");

    const commands = [
        `docker-compose -p ${config.name} -f ${serverDockerCompose} up -d mailing_db`,
        `docker-compose -p ${config.name} -f ${serverDockerCompose} run --rm mailing_app ./listmonk --install --yes`,
        `docker-compose -p ${config.name} -f ${serverDockerCompose} up -d mailing_app`
    ];

    for (let i = 0; i < commands.length; i++) {
        await execSSH(sftp.client, commands[i]);

        if(i !== commands.length - 1)
            await sleep(3000);
    }

    fs.rmSync(listmonkConfigOutFile, {force: true});

    if(!mailingServerName)
        return;

    let nginxTemplate = fs.readFileSync(__dirname + "/nginx-listmonk.conf", {encoding: "utf-8"});
    nginxTemplate = nginxTemplate.replace(/\{MAILING_SERVER_NAME\}/g, mailingServerName);
    nginxTemplate = nginxTemplate.replace(/\{APP_NAME\}/g, config.name);
    nginxTemplate = nginxTemplate.replace(/\{VERSION\}/g, config.version);

    fs.writeFileSync(__dirname + "/nginx.conf", nginxTemplate);

    const nginxListmonkFilePath = path.resolve(serverPath, "../fullstacked-listmonk");
    if(!await sftp.exists(nginxListmonkFilePath))
        await sftp.mkdir(nginxListmonkFilePath, true);
    await sftp.put(__dirname + "/nginx.conf", nginxListmonkFilePath + "/nginx.conf");

    fs.rmSync(__dirname + "/nginx.conf", {force: true});
}
