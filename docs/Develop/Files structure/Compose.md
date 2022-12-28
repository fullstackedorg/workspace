# Docker Compose Files

Docker compose files defines all your external tools. You could spin up a database or a full CMS that works in sync with your web app. Use the `[service].docker-compose.yml` file name syntax to split your services into smaller docker-compose files. You can still just use a single long `docker-compose.yml` at the root of your project. Every docker-compose definition will run within the same network unless you define something else.

Checkout these templates as examples :

- [MongoDB](https://github.com/cplepage/create-fullstacked/tree/main/templates/mongodb)

- [WordPress](https://github.com/cplepage/create-fullstacked/tree/main/templates/wordpress)
