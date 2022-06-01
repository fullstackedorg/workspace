import {execSync} from "child_process";
import fs from "fs";
import path from "path";
import sleep from "fullstacked/scripts/sleep";

// listmonk setup -_-
export default async function (config: Config){
    require('dotenv').config();

    const mailingUser = process.env.MAILING_USER ?? "listmonk";
    const mailingPass = process.env.MAILING_PASS ?? "listmonk";

    const listmonkConfigOutFile = config.out + "/config.toml";
    fs.copyFileSync(path.resolve(__dirname, "config.toml"), listmonkConfigOutFile);
    fs.appendFileSync(listmonkConfigOutFile, `\r\nadmin_username="${mailingUser}"`);
    fs.appendFileSync(listmonkConfigOutFile, `\r\nadmin_password="${mailingPass}"`);
}
