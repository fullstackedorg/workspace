import Build from "@fullstacked/build";

Build.fullstackedNodeDockerComposeSpec = null;

delete process.env.FULLSTACKED_PORT;

const main = new Build();
main.config.client = "src/main/client/index.tsx";
main.config.server = "src/main/server/index.ts";
// main.config.production = true;
main.config.outputDir = "dist/main";


const lite = new Build();
lite.config.client = "src/lite/client/index.tsx";
lite.config.server = "src/lite/server/index.ts";
// lite.config.production = true;
lite.config.outputDir = "dist/lite";

await Promise.all([
    main.run(), 
    lite.run()
]);