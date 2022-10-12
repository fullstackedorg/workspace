import * as path from "path";
import * as fs from "fs";

// remove when Fetch API is not experimental anymore
process.env.NODE_NO_WARNINGS=1;

const possibleLocation = [
    path.resolve(__dirname, "scripts/register.js"),
    path.resolve(process.cwd(), "node_modules/fullstacked/scripts/register.js")
].filter(file => fs.existsSync(file));

module.exports = {
    require: possibleLocation,
    timeout: 20000,
    exclude: "**/node_modules/**",
    "enable-source-maps": true
}
