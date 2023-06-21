FROM docker:dind

# make /home the user root folder
RUN sed -i 's/\/root:\/bin\/ash/\/home:\/bin\/ash/g' /etc/passwd
RUN rm -rf /home/dockremap

# install basic tools
RUN apk add --update make g++ nodejs npm git python3 curl

# install node-pty and fullstacked globally
RUN npm i -g node-pty fullstacked \
    @fullstacked/backup \
    @fullstacked/build \
    @fullstacked/create \
    @fullstacked/deploy \
    @fullstacked/gui \
    @fullstacked/ide \
    @fullstacked/run \
    @fullstacked/webapp \
    @fullstacked/watch

# installing code-server
RUN FORCE_NODE_VERSION=18 npm i -g --ignore-engines --unsafe-perm code-server
# https://github.com/coder/code-server/issues/5530#issuecomment-1235752382
RUN cd /usr/local/lib/node_modules/code-server/lib/vscode && npm i --legacy-peer-deps
COPY code-server-config.yml /home/.config/code-server/config.yaml

WORKDIR /home

RUN npm config set prefix '/home/.npm/'
RUN echo "export PATH=\$PATH:/home/.npm/bin" > /home/.profile

CMD ["/bin/sh", "-c", "source /home/.profile && (/usr/local/bin/dockerd-entrypoint.sh & code-server & DOCKER_HOST=\"\" fsc ide)"]
