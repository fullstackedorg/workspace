#!/usr/bin/env node

(async () => {
    if(process.argv.at(-1) === "get"){
        console.log(await (await fetch(`http://localhost:8000/rpc/initGithubDeviceFlow?0=${process.env.SESSION_ID}`)).text());
    }
    process.exit(1);
})()
