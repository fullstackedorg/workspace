import getNextAvailablePort from "fullstacked/utils/getNextAvailablePort";
import {parseArgs} from "node:util";

let {values: { count }} = parseArgs({
    options: {
        count: {
            type: "string",
            short: "c",
        }
    }
});

let countNumber = parseInt(count ?? "1");
countNumber = isNaN(countNumber) ? 1 : countNumber;

let availablePorts = [];
for (let i = 0; i < countNumber; i++) {
    const lastPortFound = availablePorts.length ? availablePorts.at(-1) + 1 : undefined
    availablePorts.push(await getNextAvailablePort(lastPortFound));
}
console.log(availablePorts.join("\n"));
