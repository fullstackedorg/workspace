import {execSync} from "child_process";
import fs from "fs";
import path from "path";
import sleep from "fullstacked/scripts/sleep";

export default async function (config: Config){
    require('dotenv').config();

    const mailingUser = process.env.MAILING_USER ?? "listmonk";
    const mailingPass = process.env.MAILING_PASS ?? "listmonk";

    const listmonkConfigOutFile = config.out + "/config.toml";
    fs.copyFileSync(path.resolve(__dirname, "config.toml"), listmonkConfigOutFile);
    fs.appendFileSync(listmonkConfigOutFile, `\r\nadmin_username="${mailingUser}"`);
    fs.appendFileSync(listmonkConfigOutFile, `\r\nadmin_password="${mailingPass}"`);

    const commands = [
        `docker-compose -p ${config.name} -f ${config.out}/docker-compose.yml up -d mailing_db`,
        `docker-compose -p ${config.name} -f ${config.out}/docker-compose.yml run --rm mailing_app ./listmonk --install --yes --idempotent`,
        `docker-compose -p ${config.name} -f ${config.out}/docker-compose.yml up -d mailing_app`
    ]

    for (let i = 0; i < commands.length; i++) {
        execSync(commands[i] + (config.silent ? " >/dev/null 2>&1" : ""));

        if(i !== commands.length - 1)
            await sleep(2000);
    }
}
