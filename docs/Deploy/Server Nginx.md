# Server Nginx

FullStacked uses nginx to route every request to right web app. Here's a small explanation on how it works and the purpose of the `--app-dir=` flag.

The root nginx service will route the server name to the right web app port. As defined in the configuration section of your deployment.

![FullStacked Server Nginx](https://files.cplepage.com/fullstacked/nginx-server-2.png)

This works with the fact that the root nginx config loads every `./*/nginx/*.conf` and on the deployment, FullStacked gets the available ports and writes them down in the `.conf` files of the current web app.

![Server Nginx Setup](https://files.cplepage.com/fullstacked/server-nginx.png)
