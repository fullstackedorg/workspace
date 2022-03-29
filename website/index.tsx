import * as React from 'react';
import webapp from "fullstacked/webapp";
import App from "./src/App";

const bootstrapCSS = document.createElement('link');
bootstrapCSS.href = "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css";
bootstrapCSS.rel = "stylesheet";
document.head.appendChild(bootstrapCSS);

webapp(<App />);
