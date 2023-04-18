FROM docker:dind

RUN apk add --update nodejs npm git
RUN npm i -g typescript node-pty fullstacked@alpha @fullstacked/ide@alpha

WORKDIR /home

CMD ["/bin/sh", "-c", "/usr/local/bin/dockerd-entrypoint.sh & DOCKER_HOST=\"\" fullstacked ide"]
