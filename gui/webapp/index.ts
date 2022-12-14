import main from "./main";
import "@tabler/core/dist/css/tabler.css";

const savedTheme = window.localStorage.getItem("theme");
if(savedTheme === "dark") document.body.classList.add("theme-dark");

main();
