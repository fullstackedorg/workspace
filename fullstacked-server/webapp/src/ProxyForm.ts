import {fetch} from "fullstacked/webapp/fetch";

export class ProxyForm extends HTMLElement {
    constructor(onSubmit: Function) {
        super();

        const labelInput = document.createElement("input");
        labelInput.placeholder = "Label";
        const portInput = document.createElement("input");
        portInput.placeholder = "Internal Port";

        const submitForm = async () => {
            await fetch.post("/apps", {
                label: labelInput.value,
                port: portInput.value
            });
            form.reset();
            onSubmit();
        }

        const form = document.createElement("form");
        form.addEventListener("submit", async e => {
            e.preventDefault();
            await submitForm();
        })

        const submitBtn = document.createElement("button");
        submitBtn.innerText = "Add Proxy";

        form.append(labelInput);
        form.append(portInput);
        form.append(submitBtn);

        this.append(form);
    }

}


customElements.define("proxy-form", ProxyForm);
