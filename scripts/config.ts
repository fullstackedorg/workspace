const defaultConfig: Config = {
    src: process.cwd(),
    out: process.cwd(),
    root: process.cwd()
}

export default function(config) {
    config = {
        ...defaultConfig,
        ...config
    }

    config.out += "/dist"

    return config;
}
