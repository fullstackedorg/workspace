import SSH from "../tests/e2e/SSH";

export default async function (){
    const sshServer = new SSH();
    await sshServer.init();

    process.on("SIGINT", () => {
        sshServer.stop();
    });
}
