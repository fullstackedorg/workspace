import FullStackedVersion from "fullstacked/version";

class Version extends HTMLElement{
    async connectedCallback(){
        this.innerHTML += `<div>You are on version <em id="version">${FullStackedVersion}</em></div>`;
    }
}

customElements.define("fullstacked-root", Version);

document.body.append(new Version());
