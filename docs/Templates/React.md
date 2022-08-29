# React
One of the most used library for frontend development.

> This guide uses React 18

1. Install react and react-dom
```shell
npm i react react-dom
```
2. Set up your entrypoint to render your React App
```html
<!-- webapp/index.html -->
<div id="root"></div>
```
```ts
// webapp/index.ts
import main from "./ReactEntrypoint";

main();
```
```tsx
// webapp/ReactEntrypoint.tsx
import * as React from 'react';
import {createRoot} from "react-dom/client";
import App from "./src/App"

export default function main(){
    const root = createRoot(document.getElementById('root'));
    root.render(<App />);
}
```
```tsx
// webapp/src/App.tsx
import * as React from 'react';

export default function App(){
    return <>
        My Awesome FullStacked React App!
    </>;
}
```

For any other docs and references, please refer to the official React [documentation](https://reactjs.org/).
