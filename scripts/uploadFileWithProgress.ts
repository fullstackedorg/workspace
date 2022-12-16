import progress from "progress-stream";
import fs from "fs";

export default async function (sftp: any, localFilePath: string, remoteFilePath: string, progressCallback: (progress: number) => void, silent = false){
    let ulStream = fs.createReadStream(localFilePath);

    if(!silent){
        const progressStream = progress({
            length: fs.statSync(localFilePath).size
        });

        progressStream.on('progress', progress => progressCallback(progress.percentage));

        ulStream = ulStream.pipe(progressStream);
    }

    await sftp.put(ulStream, remoteFilePath);
}
