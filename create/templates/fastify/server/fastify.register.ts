import Fastify, {FastifyServerOptions} from 'fastify'
import Server from "fullstacked/server";
export default function (opts: FastifyServerOptions = {}) : ReturnType<typeof Fastify> {
    let requestResolver;
    const fastify = Fastify({
        ...opts,
        serverFactory: (fastifyHandler, opts) => {
            const {handler, resolver} = Server.promisify(fastifyHandler);
            requestResolver = resolver;
            Server.listeners.push({
                title: "Fastify",
                handler
            });
            return Server.server;
        }
    });

    fastify.setNotFoundHandler(request => requestResolver(request.raw));

    return fastify;
}
