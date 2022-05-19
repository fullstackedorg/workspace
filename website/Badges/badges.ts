import {Router} from "express";
import axios from "axios";
import path from "path";
import fs from "fs";

export function registerBadgesRoutes(){

    const router = Router();

    const badges: Map<string, string> = new Map();

    // send previously saved badge
    function sendCachedBadge(res, title): boolean{
        res.set('Content-Type', 'image/svg+xml');
        const cachedBadge = badges.get(title);
        if(cachedBadge) {
            res.send(cachedBadge);
            return true;
        }

        return false;
    }

    // send and save badge in memory
    async function sendBadge(res, title, data: string, color){
        res.set('Content-Type', 'image/svg+xml');
        data = data.replace(/-/g, "--");
        const badge = (await axios.get(`https://img.shields.io/badge/${title}-${data}-${color}`)).data;
        badges.set(title, badge);
        res.send(badge)
    }

    // display coverage percentage
    router.get("/coverage.svg", async (req, res) => {
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

    // display current version from package.json
    router.get("/version.svg", async (req, res) => {
        const badgeTitle = "version";
        if(sendCachedBadge(res, badgeTitle)) return;
        await sendBadge(res, badgeTitle, process.env.VERSION ?? "undefined", "05afdd");
    });

    async function getDependencies(packageName): Promise<string[]> {
        const npmJSData = (await axios.get("https://registry.npmjs.org/" + packageName)).data;
        const lastVersion = Object.keys(npmJSData.time).pop();
        return npmJSData.versions[lastVersion] ? npmJSData.versions[lastVersion].dependencies : [];
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

    router.get("/dependencies.svg", async (req, res) => {
        const badgeTitle = "dependencies";
        if(sendCachedBadge(res, badgeTitle)) return;

        const dependencies = Object.keys(process.env.DEPENDENCIES ?? {});

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

    router.get("/dependencies/all.svg", async (req, res) => {
        const badgeTitle = "module deps";
        if(sendCachedBadge(res, badgeTitle)) return;

        const initialDependencies = Object.keys(process.env.DEPENDENCIES ?? {});

        const dependencies = new Set<string>(initialDependencies);
        await Promise.all(initialDependencies.map(dep => getDependenciesRecursively(dep, dependencies)));

        let color;
        if(dependencies.size < 50)
            color = "brightgreen";
        else if(dependencies.size < 100)
            color = "green";
        else if(dependencies.size < 200)
            color = "yellowgreen"
        else if(dependencies.size > 200)
            color = "yellow";
        else
            color = "red";

        await sendBadge(res, badgeTitle, dependencies.size.toString(), color);
    });

    return router;
}
