import {FullStackedConfig} from "fullstacked";
import {resolve, dirname} from "path";
import {fileURLToPath} from "url";
import postcss from "postcss";
import tailwind from "tailwindcss";
import * as fs from "fs";
import glob from "glob";
import cssnano from "cssnano"

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function (config: FullStackedConfig, isWebApp) {
    if(!isWebApp) return;

    const content = glob.sync(resolve(__dirname, "webapp", "**", "*.{html,js,jsx,ts,tsx}")).map(filePath => ({
        raw: fs.readFileSync(filePath, {encoding: "utf8"}),
        extension: filePath.split(".").pop()
    }))

    const postcssTasks = [
        tailwind({
            theme: {
                extend: {},
            },
            plugins: [],
            content
        })
    ]

    if(config.production)
        postcssTasks.push(cssnano({preset: 'default'}));

    // source: https://github.com/tailwindlabs/tailwindcss/discussions/1442#discussioncomment-4103374
    const {css} = await postcss(postcssTasks).process(`@tailwind base;@tailwind components;@tailwind utilities;`, {
        from: undefined
    });

    if(!fs.existsSync(config.public)) fs.mkdirSync(config.public, {recursive: true});
    fs.writeFileSync(resolve(config.public, "tailwind.css"), css);
}
