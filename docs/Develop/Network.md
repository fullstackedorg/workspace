# Network

FullStacked runs everything through a Docker Compose and this gives a massive perk. Everything runs within the same isolated network. That means connecting and fetching data from one service to another has little to no latency, and the hostnames are defined and predictable. 

Read more about docker networks [here](https://docs.docker.com/compose/networking/)

To expose ports publicly

## Exposing Ports

To expose a port publicly, you'll have to define the port in the `expose` attribute and the `ports` attribute. Only use the internal port you want to access and FullStacked will find an available port to map it to (locally and on the remote server).

If you use the `"8000:80"` syntax, FullStacked won't set up the port mapping for you and you might try to bind to an already used port.

### Example

The WordPress instance will be at the first available port starting from `8000`. Use Docker Desktop to figure out on which port it got mapped out.

```yaml
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
    expose:
      - 80
    ports:
      - 80
    environment:
      WORDPRESS_DB_HOST: wordpress_db
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress
```

## Connecting Services Internaly

In this second approach, <u>you don't have to expose any port publicly</u>. Internal ports are always accessible from within the network.

### Examples

![Network](https://files.cplepage.com/fullstacked/network.png)

#### Connecting to a DB

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

Now you can connect to the mongo instance at the service name : **mongo**

```ts
import {MongoClient} from 'mongodb';

MongoClient.connect(`mongodb://username:password@mongo:27017`);
```

#### Reverse Proxying

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
