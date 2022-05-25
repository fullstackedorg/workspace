import Server from "fullstacked/server";
import express from "express";
import {registerBadgesRoutes} from "./badges/badges";
import {MailingRoutes} from "./mailing/mailing";

const server = new Server();

server.express.use("/badges", registerBadgesRoutes());

server.express.use("/mailing", MailingRoutes.register());

server.express.use("/docs*", express.static(server.publicDir));

server.start();
export default server;
