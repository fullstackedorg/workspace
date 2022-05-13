const defaultConfig: Config = {
    src: process.cwd(),
    out: process.cwd(),
    appDir: "/home",
    dockerExtraFlags: ""
}

export default function(config) {
    config = {
        ...defaultConfig,
        ...config
    }

    config.out += "/dist"

    return config;
}
