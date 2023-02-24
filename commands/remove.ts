import {DEPLOY_CMD} from "../types/deploy";
import fs from "fs";
import Deploy from "./deploy";
import {execSSH} from "../utils/utils";

export default class Remove extends Deploy {

    async checkIfWebAppExists(): Promise<boolean> {
        const sftp = await this.getSFTP();
        const remoteDir = `${this.sshCredentials.appDir}/${this.config.name}`;
        return !!(await sftp.exists(remoteDir));
    }

    async stopDockerCompose(){
        const sftp = await this.getSFTP();

        console.log(`Stopping ${this.config.name} v${this.config.version} on remote server`);
        await execSSH(sftp.client, `docker compose -p ${this.config.name} -f ${this.sshCredentials.appDir}/${this.config.name}/docker-compose.yml down -v -t 0`, this.write);

    }

    async removeWebAppDirectory(){
        const sftp = await this.getSFTP();
        const remoteDir = `${this.sshCredentials.appDir}/${this.config.name}`;
        console.log(`Removing Directory ${remoteDir}`);
        return sftp.rmdir(remoteDir, true);
    }

    async run(tick?: () => void){
        await this.testRemoteServer();
        console.log("Connected to Remote Host");
        if(tick) tick();

        const exists = await this.checkIfWebAppExists();
        if(!exists)
            throw new Error("Web App does not exist on remote host");
        if(tick) tick();

        console.log("Stopping Web App on Remote Host");
        await this.stopDockerCompose();
        if(tick) tick();

        console.log("Removing Web App files");
        await this.removeWebAppDirectory();
        if(tick) tick();

        console.log("Restarting FullStacked Nginx on Remote Host");
        await this.startFullStackedNginxOnRemoteHost();
        if(tick) tick();

        console.log("Removal Successful");
    }

    guiCommands(): { cmd: DEPLOY_CMD; callback(data, tick?: () => void): any }[] {
        return [
            {
                cmd: DEPLOY_CMD.CHECK_SAVED_CONFIG,
                callback: () => fs.existsSync(this.configFilePath)
            },{
                cmd: DEPLOY_CMD.TEST_REMOTE_SERVER,
                callback: async ({sshCredentials}) => {
                    this.sshCredentials = sshCredentials;
                    return await this.testRemoteServer();
                }
            },{
                cmd: DEPLOY_CMD.TEST_DOCKER,
                callback: async () => await this.testDockerOnRemoteHost()
            },{
                cmd: DEPLOY_CMD.LOAD_CONFIG,
                callback: ({password}) => this.loadConfigs(password)
            },{
                cmd: DEPLOY_CMD.REMOVE,
                callback: ({sshCredentials}, tick?: () => void) => {
                    this.sshCredentials = sshCredentials;
                    return this.run(tick);
                }
            }
        ];
    }
}
