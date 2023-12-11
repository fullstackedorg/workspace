import path from "path";

export const normalizePath = maybeWindowsPath => {
    return maybeWindowsPath.split(path.sep).join("/")
}
