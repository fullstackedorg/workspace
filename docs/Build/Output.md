# Build Output

The build process bundles both the server and the webapp to optimize the amount of files and to have a no-install needed js script to run. Everything is output to the `dist` directory. This directory is exaclty what is shipped to the remote server with the `deploy` command.

The output file structure looks like this :

```
.
├── dist
|   ├── public              <-- Static file serving root
|   |   ├── index.css
|   |   ├── index.html      <-- html file with ref to js and css
|   |   └── index.js        <-- bundled webapp
|   ├── index.mjs           <-- bundled server
|   └── docker-compose.yml  <-- bundled docker-compose
├── package.json
├── server
|   └── ...
├── webapp
|   └── ...
└── ...
```
