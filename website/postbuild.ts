import fs from "fs";
import path from "path";

export default function (config: Config) {
    const packageJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../package.json"), {encoding: "utf-8"}));
    fs.writeFileSync(config.out + "/dependencies.json", JSON.stringify(packageJSON.dependencies));
}
