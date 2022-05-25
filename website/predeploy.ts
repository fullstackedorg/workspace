import {execSSH, sleep} from "../scripts/utils";
import SFTP from "ssh2-sftp-client";
import fs from "fs";
import path from "path";
import {execSync} from "child_process";

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

    if(!mailingUser || !mailingPass)
        throw new Error("Missing env file with mailing credentials");

    const listmonkConfigOutFile = config.out + "/config.toml";
    fs.copyFileSync(path.resolve(__dirname, "config.toml"), listmonkConfigOutFile);
    fs.appendFileSync(listmonkConfigOutFile, `\r\nadmin_username="${mailingUser}"`);
    fs.appendFileSync(listmonkConfigOutFile, `\r\nadmin_password="${mailingPass}"`);

    const serverPath = config.appDir + "/" + config.name ;
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
}
