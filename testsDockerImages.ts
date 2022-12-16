import Docker from "./scripts/docker.js";
import {maybePullDockerImage} from "./scripts/utils.js";

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
