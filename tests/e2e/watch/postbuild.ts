import fs from "fs";
import path, {dirname} from "path";
import {fileURLToPath} from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default function (){
    const testFile = path.resolve(__dirname, "post-test.txt");

    const count = fs.existsSync(testFile) ? parseInt(fs.readFileSync(testFile, {encoding: "utf-8"})) : 0;

    fs.writeFileSync(testFile, (count + 1).toString());
}
