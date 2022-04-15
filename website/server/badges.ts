import {Application} from "express";
import axios from "axios";
import path from "path";
import fs from "fs";

/*
* All these routes should be built in FulLStacked
* since they display the health of the project
 */

export function registerBadgesRoutes(app: Application){

    const badges: Map<string, string> = new Map();

    function sendCachedBadge(res, title): boolean{
        res.set('Content-Type', 'image/svg+xml');
        const cachedBadge = badges.get(title);
        if(cachedBadge) {
            res.send(cachedBadge);
            return true;
        }

        return false;
    }

    async function sendBadge(res, title, data: string, color){
        res.set('Content-Type', 'image/svg+xml');
        data = data.replace(/-/g, "--");
        const badge = (await axios.get(`https://img.shields.io/badge/${title}-${data}-${color}`)).data;
        badges.set(title, badge);
        res.send(badge)
    }

    app.get("/coverage/badge.svg", async (req, res) => {
        const badgeTitle = "coverage";
        if(sendCachedBadge(res, badgeTitle)) return;

        const coverageFile = path.resolve(__dirname, "public/coverage/index.html");
        let coverage = 0;
        if(fs.existsSync(coverageFile)){
            const coverageIndexHTML = fs.readFileSync(coverageFile, {encoding: "utf8"});
            const digitsSpan = coverageIndexHTML.match(/<span class="strong">.*<\/span>/g);
            coverage = parseFloat(digitsSpan[0].slice(`<span class="strong">`.length, -`</span>`.length));
        }

        let color;
        if(coverage > 98)
            color = "brightgreen";
        else if(coverage > 90)
            color = "green";
        else if(coverage > 80)
            color = "yellowgreen"
        else if(coverage > 60)
            color = "yellow";
        else
            color = "red";

        await sendBadge(res, badgeTitle, coverage.toFixed(2) + "%25", color);
    });

    app.get("/version/badge.svg", async (req, res) => {
        const badgeTitle = "version";
        if(sendCachedBadge(res, badgeTitle)) return;

        const npmJSData = (await axios.get("https://registry.npmjs.org/fullstacked")).data;
        const lastVersion = Object.keys(npmJSData.time).pop();

        await sendBadge(res, badgeTitle, lastVersion, "05afdd");
    });

    async function getDependencies(packageName): Promise<string[]> {
        const npmJSData = (await axios.get("https://registry.npmjs.org/" + packageName)).data;
        const lastVersion = Object.keys(npmJSData.time).pop();
        return npmJSData.versions[lastVersion].dependencies;
    }

    async function getDependenciesRecursively(packageName: string, deps: Set<string>): Promise<Set<string>>{
        const dependencies = await getDependencies(packageName);
        if(dependencies) {
            const depsArr = Object.keys(dependencies);
            depsArr.forEach(dep => deps.add(dep));
            await Promise.all(depsArr.map(dep => getDependenciesRecursively(dep, deps)));
        }
        return deps;
    }


    // TODO: these two should be based on the package.json, not npmjs
    app.get("/dependencies/badge.svg", async (req, res) => {
        const badgeTitle = "dependencies";
        if(sendCachedBadge(res, badgeTitle)) return;

        const dependencies = Object.keys(await getDependencies("fullstacked"));

        let color;
        if(dependencies.length < 5)
            color = "brightgreen";
        else if(dependencies.length < 15)
            color = "green";
        else if(dependencies.length < 30)
            color = "yellowgreen"
        else if(dependencies.length > 50)
            color = "yellow";
        else
            color = "red";

        await sendBadge(res, badgeTitle, dependencies.length.toString(), color);
    });

    app.get("/dependencies/all/badge.svg", async (req, res) => {
        const badgeTitle = "module deps";
        if(sendCachedBadge(res, badgeTitle)) return;

        const dependencies = new Set<string>();
        await getDependenciesRecursively("fullstacked", dependencies);

        let color;
        if(dependencies.size < 50)
            color = "brightgreen";
        else if(dependencies.size < 100)
            color = "green";
        else if(dependencies.size < 200)
            color = "yellowgreen"
        else if(dependencies.size > 300)
            color = "yellow";
        else
            color = "red";

        await sendBadge(res, badgeTitle, dependencies.size.toString(), color);
    });
}
