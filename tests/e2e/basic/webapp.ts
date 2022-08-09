class Basic extends HTMLElement {
    connectedCallback(){
        this.innerText = "Basic Test"
    }
}
customElements.define("basic-test", Basic)
