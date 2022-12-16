import main from "./main";
import "@tabler/core/dist/css/tabler.css";

declare global {
    interface Array<T> {
        at(index: number): T;
    }
}

const savedTheme = window.localStorage.getItem("theme");
if(savedTheme === "dark") document.body.classList.add("theme-dark");

main();
