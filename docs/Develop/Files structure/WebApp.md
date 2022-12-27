# WebApp

The WebApp is built with three main file:

- index.ts

- index.html

- index.css

Those three files will be watch by default with `watch` command. The act just like a static would to. 

**Don't try to add your `.js` and `.css` file inside the `.html`**. This is all taken care of in the build process.

## Using `tsx`

Since the build command only checks for `webapp/index.ts` to use `.tsx` you just need to import your `.tsx` entrypoint and from there you should be good to go.

```ts
// webapp/index.ts
import main from "./main.tsx";

main();
```

```tsx
// webapp/main.tsx
import React, {createRoot} from "react";
import App from "react/App.tsx";

export function main(){
    const root = createRoot(document.getElementById("root"));
    root.render(<App />);
}
```

To get more familiar with that, checkout the [react template](https://github.com/cplepage/create-fullstacked/tree/main/templates/react/webapp).
