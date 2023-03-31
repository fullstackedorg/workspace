import { getModulePathWithT, invalidateModule } from "./utils";

const ws = new WebSocket("ws" +
    (window.location.protocol === "https:" ? "s" : "") +
    "://" + window.location.host);

let tree, basePath, assetsPath, entrypoint;

function removeError() {
    document.querySelector("#error-container")?.remove();
}

function displayError(errorData) {
    let errorContainer: HTMLDivElement = document.querySelector("#error-container");
    if (!errorContainer) {
        errorContainer = document.createElement("div");
        errorContainer.setAttribute("id", "error-container");
        document.body.append(errorContainer);
        errorContainer.style.cssText = `
      padding: 1rem;
      position: fixed;
      height: 100%;
      width: 100%;
      top: 0;
      left: 0;
      background-color: rgba(255, 255, 255, 0.8);
    `;
    }
    errorContainer.innerText = errorData.map(error => `Error in file [${error.location.file}:${error.location.line}]\n` +
        error.notes.map(errorNote => `> ${errorNote.location.lineText}`).join("\n") +
        `\n${error.text}`).join("\n");
}

function reloadCSSFile(cssFileName) {
    const styleTags = document.querySelectorAll("link");
    const currentTagToRemove = Array.from(styleTags).find(styleTag =>
        new URL(styleTag.getAttribute("href"), window.location.origin).pathname.endsWith(cssFileName));

    const newTag = document.createElement("link");
    newTag.href = "/" + cssFileName + "?t=" + Date.now();
    newTag.setAttribute("rel", "stylesheet");

    document.head.append(newTag);

    currentTagToRemove?.remove();
}

function sleep(ms: number) {
    return new Promise(res => setTimeout(res, ms));
}

async function waitForServer() {
    const signal = AbortSignal.timeout(500);
    try {
        await fetch(window.location.href, { signal });
    } catch (e) {
        await sleep(100);
        return waitForServer();
    }
}

declare global {
    interface Window { getModuleImportPath: Function }
}

window.getModuleImportPath = (modulePath) => {
    const {path, isAsset} = getModulePathWithT(modulePath, tree);
    return isAsset
        ? `${assetsPath}/${path}`
        : path.replace(basePath, "");
}

function reloadFromEntrypoint(){
    return import(window.getModuleImportPath(entrypoint));
}

ws.onmessage = async (message) => {
    const { type, data } = JSON.parse(message.data);

    switch (type) {
        case "setup":
            tree = data.tree;
            basePath = data.basePath;
            assetsPath = data.assetsPath;
            entrypoint = data.entrypoint;
            return reloadFromEntrypoint();
        case "module":
            removeError()
            tree = invalidateModule(data, tree);
            return reloadFromEntrypoint();
        case "error":
            displayError(data);
            break;
        case "css":
            reloadCSSFile(data);
            break;
        case "asset":
            tree = invalidateModule(data, tree);
            return reloadFromEntrypoint();
        case "reload":
            window.location.reload();
            break;
        case "server":
            await sleep(100);
            await waitForServer();
            window.location.reload();
    }
};
