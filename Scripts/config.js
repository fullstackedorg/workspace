const defaultConfig = {
    src: process.cwd(),
    out: process.cwd(),
    watcher: false
}

module.exports = (config) => {
    config = {
        ...defaultConfig,
        ...config
    }

    config.out += "/dist"

    return config;
}
