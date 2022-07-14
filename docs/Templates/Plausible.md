# Plausible
* Website: https://plausible.io/
* GitHub: https://github.com/plausible/analytics

Plausible is an awesome traffic monitoring.
They call themselves the "web analytics alternative to Google Analytics".
It is super useful to track the performance of any type web app or website.

1. Add the `Plausible` needed images to your `docker-compose.yml`
```yml
plausible_db:
  image: postgres:12
  restart: unless-stopped
  volumes:
    - ./${VERSION}/postgres/plausible.sql:/docker-entrypoint-initdb.d/plausible.sql
    - plausible-data:/var/lib/postgresql/data
  environment:
    - POSTGRES_PASSWORD=postgres

plausible_events_db:
  image: yandex/clickhouse-server:21.3.2.5
  restart: unless-stopped
  ulimits:
    nofile:
      soft: 262144
      hard: 262144

plausible:
  image: plausible/analytics:latest
  restart: unless-stopped
  command: sh -c "sleep 10 && /entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh db init-admin && /entrypoint.sh run"
  depends_on:
    - plausible_db
    - plausible_events_db
  ports:
    - "${PORT}:8000"
  environment:
    ADMIN_USER_EMAIL: email@example.com
    ADMIN_USER_NAME: username
    ADMIN_USER_PWD: password
    BASE_URL: https://plausible.example.com
    SECRET_KEY_BASE: "use https://generate.plus/en/base64 to generate a 64 bytes secret key"
```
2. 
