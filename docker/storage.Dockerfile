FROM node:18-alpine

RUN apk add tini && \
    mkdir /fullstacked

RUN cd /fullstacked && \
    npm init -y && \
    npm install @fullstacked/sync@alpha

WORKDIR /fullstacked

EXPOSE 8080

CMD ["tini", "--", "/bin/sh", "-c", "npx fsc sync --server --directory /home"]