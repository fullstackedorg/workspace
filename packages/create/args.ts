export const argsSpecs = {
    templates: {
        short: "t",
        type: "string[]",
        description: "Templates to install. View available here\nhttps://github.com/cplepage/create-fullstacked/tree/main/templates"
    },
    dir: {
        type: "string",
        default: process.cwd(),
        defaultDescription: "Current directory"
    },
    tag: {
        type: "string",
        default: "latest",
        defaultDescription: "latest"
    },
    ts: {
        type: "boolean",
        default: false,
        defaultDescription: "false"
    }
} as const;
