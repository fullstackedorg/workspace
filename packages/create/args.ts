export const argsSpecs = {
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
    js: {
        type: "boolean",
        default: false,
        defaultDescription: "false",
        description: "Create project with JS files\n(Instead of TS)"
    }
} as const;
