import Docker from "dockerode";
import {execSync} from "child_process";
/**
 *
 * 1. Check if docker is locally installed
 * 2. Check if docker is running
 * 3. return dockerode instance
 *
 */

function checkIfDockerCLIIsInstalled(){
    try{
        execSync("docker --version", {stdio: "ignore"});
    }catch (e) {
        return false;
    }
    return true;
}

async function pingDocker(docker){
    try{
        await docker.ping();
    }catch (e) {
        return false;
    }
    return true;
}

export default async function(){
    const docker = new Docker();
    // 1.
    if(!checkIfDockerCLIIsInstalled()){
        console.log("Docker is a requirement for FullStacked. Please install Docker Desktop from here: https://www.docker.com/");
        process.exit(1);
    }else if(!await pingDocker(docker)){
        console.log("Make sure Docker is running...");
        process.exit(1);
    }

    //2.
    return docker;
}
