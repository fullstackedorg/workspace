#!/usr/bin/env node
import defaultConfig from "./utils/config";
import parseConfigFromCommand from "./utils/parseConfigFromCommand";

const {script, config} = parseConfigFromCommand();

defaultConfig(config).then(async configReady => {
    const scriptModule = await import(script);

    const CommandClass = scriptModule.default;
    let command;
    if(script.endsWith("deploy.js") || script.endsWith("watch.js") || script.endsWith("run.js") || script.endsWith("remove.js"))
        command = new CommandClass(configReady);
    else
        CommandClass(configReady);

    if(config.gui) {
        const guiModule = await import("./utils/gui");
        await guiModule.default(command);
    }else if(command?.runCLI)
        command.runCLI();
});


