import crypto from "crypto";
import fs from "fs";
import {execSync} from "child_process";
import randStr from "fullstacked/utils/randStr";

export default class Info {
    static webAppName = randStr();
    static version = "0";
    static hash = crypto.randomBytes(6).toString('hex');

    constructor(packageJsonFilePath: string) {
        let packageJsonData;
        if(fs.existsSync(packageJsonFilePath))
            packageJsonData = JSON.parse(fs.readFileSync(packageJsonFilePath).toString());

        if(packageJsonData?.name){
            Info.webAppName = slugify(packageJsonData?.name);
        }

        if(packageJsonData?.version){
            Info.version = packageJsonData?.version;
        }

        const gitCommitShortHash = this.getGitShortCommitHash();
        if(gitCommitShortHash)
            Info.hash = gitCommitShortHash;
    }

    private getGitShortCommitHash(){
        try{
            const commitHash = execSync("git rev-parse --short HEAD").toString().trim();
            return commitHash.startsWith("fatal") ? "" : commitHash;
        }
        catch (e){
            return ""
        }
    }
}


function slugify(string) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìıİłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return string.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[^\w\-]+/g, '') // Remove all non-word characters
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
}
