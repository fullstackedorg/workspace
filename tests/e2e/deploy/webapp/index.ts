document.body.innerHTML = `<fullstacked-element></fullstacked-element>`;

class FullStacked extends HTMLElement{
    connectedCallback(){
        this.innerHTML = `<h1>Deploy Test</h1>
<div id="version">${process.env.VERSION}</div>`;
    }
}

customElements.define("fullstacked-element", FullStacked);
