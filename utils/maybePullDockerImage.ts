import {clearLine, cursorTo} from "readline";
import Docker from "fullstacked/utils/docker";

export async function maybePullDockerImage(image){
    const dockerClient = await Docker.getClient();

    try{
        await (await dockerClient.getImage(image)).inspect();
    }catch (e){
        const pullStream = await dockerClient.pull(image);
        await new Promise<void>(resolve => {
            pullStream.on("data", dataRaw => {
                const dataParts = dataRaw.toString().match(/{.*}/g);
                dataParts.forEach((part) => {
                    const {status, progress} = JSON.parse(part);
                    clearLine(process.stdout, 0);
                    cursorTo(process.stdout, 0, null);
                    process.stdout.write(`[${image}] ${status} ${progress || " "}`);
                });

            })
            pullStream.on("end", () => {
                clearLine(process.stdout, 0);
                cursorTo(process.stdout, 0, null);
                resolve();
            });
        });
    }
}
