import Docker from "./docker.js";
import {maybePullDockerImage} from "./utils.js";

const images = [
    "node:18-alpine",
    "mongo",
    "busybox"
];

(async () => {
    const docker = await Docker();
    for(const image of images){
        await maybePullDockerImage(docker, image)
    }
})()
