import {execSync} from "child_process";
import {printLine, silenceCommandLine} from "../../scripts/utils";

export default class {
    containerName = "dind";
    sshPort = 2222;
    username = "root";
    password = "docker";
    httpPort = 8000;

    init(){
        execSync(`docker rm -f ${this.containerName}`, {stdio: "ignore"});
        printLine("Setting up dind container with SSH");
        execSync(`docker build -t cplepage/fullstacked-ssh-server:latest ${__dirname}`, {stdio: "ignore"})
        execSync(`docker run --privileged -d -p ${this.sshPort}:22 -p ${this.httpPort}:80 --name ${this.containerName} cplepage/fullstacked-ssh-server`);
        printLine("Installing ssh server");
        execSync(`docker exec -d ${this.containerName} sh -c "echo -n \\\"${this.username}:${this.password}\\\" | chpasswd"`);
        execSync(`docker exec -d ${this.containerName} /usr/sbin/sshd -D`);

        return new Promise<void>(resolve => {
            const interval = setInterval(() => {
                try{
                    execSync(silenceCommandLine(`docker exec ${this.containerName} docker ps`))
                    clearInterval(interval);
                    return resolve();
                }catch (e) {}
            }, 200);
        });
    }

    stop(){
        execSync(`docker rm -f ${this.containerName} -v`);
    }
}
