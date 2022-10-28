import {askToContinue, execSSH} from "./utils";

// check if docker is installed on remote host
async function isDockerInstalledOnRemote(ssh2): Promise<boolean>{
    const dockerVersion = await execSSH(ssh2, "docker -v");
    return dockerVersion !== "";
}

// install docker on remote host
async function installDocker(ssh2) {
    let commands = [
        "yum install docker -y",
        "wget https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)",
        "mv docker-compose-$(uname -s)-$(uname -m) /usr/local/bin/docker-compose",
        "chmod -v +x /usr/local/bin/docker-compose",
        "systemctl enable docker.service",
        "systemctl start docker.service",
        "chmod 666 /var/run/docker.sock"
    ]

    for (let i = 0; i < commands.length; i++) {
        await execSSH(ssh2, "sudo " + commands[i]);
    }
}

export default async function(sftp){
    // check if docker is installed on remote
    if(!await isDockerInstalledOnRemote(sftp.client)) {
        console.log('\x1b[33m%s\x1b[0m', "You are about to install Docker on your remote host");
        if(!await askToContinue("Continue"))
            return;

        await installDocker(sftp.client);
        if(!await isDockerInstalledOnRemote(sftp.client))
            return console.log('\x1b[31m%s\x1b[0m', "Could not install Docker on remote host");
    }
}
