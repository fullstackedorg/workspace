import {Socket} from "net";

// source: https://stackoverflow.com/a/66116887
export default function getNextAvailablePort(port: number = 8000): Promise<number> {
    return new Promise((resolve, reject) => {
        const socket = new Socket();

        const timeout = () => {
            resolve(port);
            socket.destroy();
        };

        const next = () => {
            socket.destroy();
            resolve(getNextAvailablePort(++port));
        };

        setTimeout(timeout, 200);
        socket.on("timeout", timeout);

        socket.on("connect", function () {
            next();
        });

        socket.on("error", function (exception) {
            if ((exception as any).code !== "ECONNREFUSED") {
                reject(exception);
            } else {
                timeout();
            }
        });

        socket.connect(port, "0.0.0.0");
    });
}
