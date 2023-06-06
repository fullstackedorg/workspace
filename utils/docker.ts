import Dockerode from "dockerode";
import {execSync} from "child_process";

export default class Docker {
    private static client: Dockerode;

    static async getClient(){
        if(!this.client) {
            this.client = new Dockerode();

            if(!this.checkIfDockerCLIIsInstalled()){
                console.log("Docker is a requirement for some of the FullStacked commands.\n" +
                    "Please install Docker Desktop from here: https://www.docker.com/");
                process.exit(1);
            }else if(!await this.pingDocker()){
                console.log("Make sure Docker is running...");
                process.exit(1);
            }
        }

        return this.client;
    }

    private static checkIfDockerCLIIsInstalled(){
        try{
            execSync("docker --version", {stdio: "ignore"});
        }catch (e) {
            return false;
        }
        return true;
    }

    private static async pingDocker(){
        try{
            await this.client.ping();
        }catch (e) {
            return false;
        }
        return true;
    }
}
