import Docker from "../utils/docker";
import {maybePullDockerImage} from "../utils/utils";

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
