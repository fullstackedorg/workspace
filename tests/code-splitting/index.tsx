import React from 'React';
import webapp from "fullstacked/webapp";

(async () => {
    const lazyLoad = await import("./LazyLoad");
    webapp(lazyLoad.default());
})()
