import fs from "fs";

fs.writeFileSync(__dirname + "/test-postbuild.txt", "test postbuild");

export default async function(){
    fs.writeFileSync(__dirname + "/test-postbuild-2.txt", "test postbuild async");
}
