import {fetch} from "fullstacked/webapp/fetch";
import Cookie from "js-cookie";

export class ProxyList extends HTMLElement {
    constructor() {
        super();
    }

    async connectedCallback(){
        await this.reloadList()
    }

    async reloadList(){
        this.innerHTML = "";
        const apps = await fetch.get("/apps");
        Object.keys(apps).forEach(appLabel => {
            const appLink = document.createElement("div");
            appLink.classList.add("app-link");
            appLink.innerText = appLabel + " => " + apps[appLabel];
            appLink.addEventListener("click", () => {
                Cookie.set("app", appLabel);
                window.location.reload();
            });
            this.append(appLink);
        });
    }
}

customElements.define("proxy-list", ProxyList);
