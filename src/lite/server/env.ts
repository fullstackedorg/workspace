import { parseArgs } from "util";
import dotenv from "dotenv";

const { values: { env } } = parseArgs({
    options: {
        env: {
            type: "string",
            multiple: true,
            short: "e",
        }
    },
});

if (env) {
    const config = dotenv.parse(env.join("\n"));
    console.log(config)
    Object.entries(config).forEach(([name, value]) => {
        process.env[name] = value;
    })
}