import Docker from "../utils/docker";
import {maybePullDockerImage} from "../utils/utils";

export async function maybePullImages(images: string[]){
    const docker = await Docker();
    for(const image of images){
        await maybePullDockerImage(docker, image)
    }
}

await maybePullImages([
    "node:18-alpine",
    "mongo",
    "busybox",
    "redis"
])


