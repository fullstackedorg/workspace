//@ts-nocheck
import * as path from "path";
import * as fs from "fs";

const possibleLocation = [
    path.resolve(__dirname, "scripts/register.js"),
    path.resolve(process.cwd(), "node_modules/fullstacked/scripts/register.js")
].filter(file => fs.existsSync(file));

export default {
    require: possibleLocation,
    timeout: 20000,
    exclude: "**/node_modules/**",
    "enable-source-maps": true
}
