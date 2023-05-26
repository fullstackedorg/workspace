import * as packages from "../../pack";
import {execSync} from "child_process";

execSync(`npm i -g ${Object.keys(packages).map(pkg => packages[pkg]).join(" ")}`, {stdio: "inherit"});
