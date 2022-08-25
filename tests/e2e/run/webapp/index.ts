document.body.innerHTML += `<fullstacked-element></fullstacked-element>`;

class FullStackedRun extends HTMLElement{
    connectedCallback(){
        this.innerHTML = "Run Test";
    }
}

customElements.define("fullstacked-element", FullStackedRun);
