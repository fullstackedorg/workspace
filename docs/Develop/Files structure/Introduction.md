# Files Structure

FullStacked mostly uses the `*[service].[type].[ext]` syntax. This way it is easy to regroup the needed scripts per service name. The most important folders are `server` and `webapp` that defines your entrypoints for both your backend and frontend.

## Example

This is what a file structure would look like for a project currently using TailwindCSS in the frontend with expressjs in the backend and wordpress as the CMS.

```
.
├── .fullstacked
├── package.json
├── package-lock.json
├── server
│   ├── express.server.ts
│   └── index.ts
├── tailwind.prebuild.ts
├── webapp
│   ├── index.css
│   ├── index.html
│   └── index.ts
└── wordpress.docker-compose.yml
```
