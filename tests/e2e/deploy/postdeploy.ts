/* istanbul ignore file */
import fs from "fs";

fs.writeFileSync(__dirname + "/postdeploy.txt", "postdeploy");
