import SFTP from "ssh2-sftp-client";
import fs from "fs";
import path from "path";

// listmonk setup -_-
export default async function (config: Config, sftp: SFTP) {
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

    await sftp.put(listmonkConfigOutFile, serverPath + "/config.toml");

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
