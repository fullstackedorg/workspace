import fastifyRegister from "./fastify.register";

const fastify = fastifyRegister();

fastify.get('/hello-fastify', function (request, reply) {
    reply.send("Hello from Fastify");
});

fastify.ready();
