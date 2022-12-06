import {ProxyForm} from "./src/ProxyForm";
import {ProxyList} from "./src/ProxyList";

class FullStackedPortal extends HTMLElement {
    list = new ProxyList();
    form = new ProxyForm(this.list.reloadList.bind(this.list));

    constructor() {
        super();

        this.append(this.form);
        this.append(this.list);
    }
}

customElements.define("fullstacked-root", FullStackedPortal);
