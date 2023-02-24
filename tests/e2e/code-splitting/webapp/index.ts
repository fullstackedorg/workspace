document.body.innerHTML += `<div id="root"><lazy-loaded></lazy-loaded></div>`;

await import("./LazyLoad");

export {};
