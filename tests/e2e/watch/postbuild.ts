import fs from "fs";
import path from "path";

export default function (){
    const testFile = path.resolve(__dirname, "post-test.txt");

    const count = fs.existsSync(testFile) ? parseInt(fs.readFileSync(testFile, {encoding: "utf-8"})) : 0;

    fs.writeFileSync(testFile, (count + 1).toString());
}
