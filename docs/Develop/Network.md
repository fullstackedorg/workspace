# Network

Running everything through a Docker Compose like FullStacked does gives the massive perk that everything runs within an isolated network. That means connecting and fetching data from one service to another has little to no latency, and the hostnames are defined and predictable. 

Read more about docker networks [here](https://docs.docker.com/compose/networking/)

## Examples

### Connecting to a DB

Let's say we run a web app with MongoDB.

```yml
# mongo.docker-compose.yml
services:
  mongo:
    image: mongo
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: username
      MONGO_INITDB_ROOT_PASSWORD: password
```

Now I can connect to the mongo instance at the service name : **mongo**

```ts
import {MongoClient} from 'mongodb';

MongoClient.connect(`mongodb://username:password@mongo:27017`);
```

### Reverse Proxying

```yml
# wordpress.docker-compose.yml
services:
  wordpress_db:
    image: mysql:5.7
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: somewordpress
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress

  wordpress:
    depends_on:
      - wordpress_db
    image: wordpress:latest
    restart: unless-stopped
    environment:
      WORDPRESS_DB_HOST: wordpress_db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
```

Now my wordpress instance is inside my docker network at **wordpress**. So I can just reverse-proxy too it and access the wordpress directly.

```ts
import httpProxy from "http-proxy";
import Server from "fullstacked/server";

const proxy = httpProxy.createServer();

Server.addListener((req, res) => {
    return new Promise<void>(resolve => {
        // on error, resolve and exit this listener
        proxy.web(req, res, {target: "http://wordpress"}, resolve);
    });
});
```
