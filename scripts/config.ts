const defaultConfig: Config = {
    src: process.cwd(),
    out: process.cwd(),
    publicPath: "./",
    watcher: false,
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
