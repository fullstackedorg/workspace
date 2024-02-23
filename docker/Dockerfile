FROM docker:dind

# install basic tools
RUN apk add --update bash make g++ nodejs npm git python3 curl vim gcompat tini \
    curl-dev openssl-dev krb5-dev

# Bun and Deno (and probably other binaries) glibc dependency
# source https://github.com/oven-sh/bun/issues/3075#issuecomment-1565069263
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r1/glibc-2.35-r1.apk && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r1/glibc-bin-2.35-r1.apk && \
    apk --no-cache --force-overwrite add glibc-2.35-r1.apk glibc-bin-2.35-r1.apk && \
    /usr/glibc-compat/bin/ldd /lib/ld-linux-x86-64.so.2 && \
    rm -rf glibc-2.35-r1.apk glibc-bin-2.35-r1.apk

# github device flow setup
COPY docker/github-credential.js /root/github-credential
RUN chmod +x /root/github-credential
COPY docker/gitconfig-base /home/.gitconfig

# add current fullstacked build
COPY dist/main /fullstacked/dist/main
COPY index.js /fullstacked/index.mjs
RUN cd /fullstacked && npm i node-pty

# add code-oss package
COPY code-oss /fullstacked/code-oss
RUN cd /fullstacked/code-oss &&  \
    rm -rf /fullstacked/code-oss/node_modules /fullstacked/code-oss/package-lock.json && \
    npm i --legacy-peer-deps

# make /home the user root folder
RUN sed -i 's/\/root:\/bin\/ash/\/home:\/bin\/ash/g' /etc/passwd
WORKDIR /home

RUN rm -rf /home/dockremap && \
    npm config set prefix '/home/.npm/' && \
    echo "export PATH=\$PATH:/home/.npm/bin:/fullstacked/dist/main/server/bin" >> /etc/profile && \
    echo "export DOCKER_HOST=\"\"" >> /etc/profile && \
    echo "export PS1='\w \$ '" >> /etc/profile && \
    echo "export DOCKER_RUNTIME=1" >> /etc/profile

CMD ["tini", "--", "/bin/sh", "-c", "/usr/local/bin/dockerd-entrypoint.sh & DOCKER_RUNTIME=1 node /fullstacked/index.mjs"]
