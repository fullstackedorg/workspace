import {execSync} from "child_process";
import {printLine, silenceCommandLine} from "../../scripts/utils";

export default class {
    containerName = "dind";
    sshPort = 2222;
    username = "root";
    password = "docker";
    httpPort = 8000;
    httpsPort = 8443;

    init(){
        execSync(`docker rm -f ${this.containerName}`, {stdio: "ignore"});
        printLine("Setting up dind container with SSH");
        execSync(`docker run --privileged -d -p ${this.sshPort}:22 -p ${this.httpPort}:80 -p ${this.httpsPort}:443 --name ${this.containerName} docker:dind`);
        printLine("Installing ssh server");
        execSync(silenceCommandLine(`docker exec ${this.containerName} apk del openssh-client`));
        execSync(`docker exec ${this.containerName} apk add --update --no-cache openssh`);
        execSync(`docker exec ${this.containerName} sh -c "echo \\\"PasswordAuthentication yes\\\" >> /etc/ssh/sshd_config"`);
        execSync(`docker exec ${this.containerName} sh -c "echo \\\"PermitRootLogin yes\\\" >> /etc/ssh/sshd_config"`);
        execSync(`docker exec ${this.containerName} ssh-keygen -A`);
        execSync(`docker exec -d ${this.containerName} sh -c "echo -n \\\"${this.username}:${this.password}\\\" | chpasswd"`);
        execSync(`docker exec -d ${this.containerName} /usr/sbin/sshd -D`);
    }

    stop(){
        execSync(`docker rm -f ${this.containerName} -v`);
    }
}
