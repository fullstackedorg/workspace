import Server from "@fullstacked/webapp/server"
import Fastify from 'fastify'

const fastify = Fastify({
    serverFactory: (handler, opts) => {
        Server.addListener("/fastify", {
            name: "Fastify",
            handler
        });
        return Server.server;
    }
});

fastify.get('/hello-world', function (request, reply) {
    reply.send("Hello World");
});

fastify.ready();
