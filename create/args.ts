export const argsSpecs = {
    templates: {
        short: "t",
        type: "string[]",
        description: "Templates to install. View available here\nhttps://github.com/cplepage/create-fullstacked/tree/main/templates"
    },
    projectDir: {
        short: "p",
        type: "string",
        default: process.cwd(),
        defaultDescription: "Current directory"
    },
    fullstackedVersion: {
        short: "v",
        type: "string",
        default: "latest",
        defaultDescription: "latest"
    }
} as const;
