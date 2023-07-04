FROM docker:dind

# install basic tools
RUN apk add --update make g++ nodejs npm git python3 curl gcompat tini

# install git-credential-manager
RUN curl -L https://github.com/git-ecosystem/git-credential-manager/releases/download/v2.1.2/gcm-linux_amd64.2.1.2.tar.gz -o /tmp/gcm.tar.gz && \
    tar -xvf /tmp/gcm.tar.gz -C /usr/bin && \
    rm /tmp/gcm.tar.gz && \
    echo "export GCM_CREDENTIAL_STORE=plaintext" > /root/.profile

# make /home the user root folder
RUN sed -i 's/\/root:\/bin\/ash/\/home:\/bin\/ash/g' /etc/passwd

# install node-pty and fullstacked globally
RUN npm i -g yarn node-pty fullstacked \
    @fullstacked/backup \
    @fullstacked/build \
    @fullstacked/create \
    @fullstacked/deploy \
    @fullstacked/gui \
    @fullstacked/ide \
    @fullstacked/run \
    @fullstacked/webapp \
    @fullstacked/watch

WORKDIR /home

RUN rm -rf /home/dockremap && \
    npm config set prefix '/home/.npm/' && \
    echo "export PATH=\$PATH:/home/.npm/bin" >> /root/.profile && \
    mkdir -p /home/.npm/lib && \
    git-credential-manager configure

CMD ["tini", "--", "/bin/sh", "-c", "source /root/.profile && (/usr/local/bin/dockerd-entrypoint.sh & DOCKER_HOST=\"\" fsc ide)"]
