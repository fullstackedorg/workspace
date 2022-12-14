import Docker from "./scripts/docker";
import {maybePullDockerImage} from "./scripts/utils";

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
