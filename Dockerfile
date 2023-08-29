FROM docker:dind

# install basic tools
RUN apk add --update make g++ nodejs npm git python3 curl vim gcompat tini \
    curl-dev openssl-dev krb5-dev libxml2-dev sqlite-dev oniguruma-dev

# Bun and Deno (and probably other binaries) glibc dependency
# source https://github.com/oven-sh/bun/issues/3075#issuecomment-1565069263
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r1/glibc-2.35-r1.apk && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.35-r1/glibc-bin-2.35-r1.apk && \
    apk --no-cache --force-overwrite add glibc-2.35-r1.apk glibc-bin-2.35-r1.apk && \
    /usr/glibc-compat/bin/ldd /lib/ld-linux-x86-64.so.2 && \
    rm -rf glibc-2.35-r1.apk glibc-bin-2.35-r1.apk

# add code-oss package
COPY code-oss/vscode-reh-web-linux-x64 /code-oss
RUN cd /code-oss && npm i --legacy-peer-deps

# github device flow setup
COPY github-credential.js /root/github-credential
RUN chmod +x /root/github-credential
COPY gitconfig-base /home/.gitconfig

# install fullstacked globally
RUN npm i -g fullstacked && \
    ln -s /usr/local/lib/node_modules/fullstacked/node_modules/@fullstacked/cli/cli.js /usr/local/bin/fsc && \
    ln -s /usr/local/lib/node_modules/fullstacked/node_modules/@fullstacked/cli/cli.js /usr/local/bin/fullstacked

# make /home the user root folder
RUN sed -i 's/\/root:\/bin\/ash/\/home:\/bin\/ash/g' /etc/passwd
WORKDIR /home

RUN rm -rf /home/dockremap && \
    npm config set prefix '/home/.npm/' && \
    echo "export PATH=\$PATH:/home/.npm/bin" >> /etc/profile && \
    echo "export DOCKER_HOST=\"\"" >> /etc/profile && \
    echo "export PS1='\w \$ '" >> /etc/profile && \
    mkdir -p /home/.npm/lib

CMD ["tini", "--", "/bin/sh", "-c", "/usr/local/bin/dockerd-entrypoint.sh & node /code-oss/out/server-main.js --without-connection-token --host 0.0.0.0 --port 8888 & fsc workspace"]
