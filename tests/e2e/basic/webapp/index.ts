document.body.innerHTML += `<div id="root"><basic-test></basic-test></div>`;

class Basic extends HTMLElement {
    connectedCallback(){
        this.innerText = "Basic Test"
    }
}
customElements.define("basic-test", Basic);
