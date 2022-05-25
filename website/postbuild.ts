import {getPackageJSON} from "../scripts/utils";
import fs from "fs";

export default function (config: Config) {
    const packageJSON = getPackageJSON();
    fs.writeFileSync(config.out + "/dependencies.json", JSON.stringify(packageJSON.dependencies));
}
