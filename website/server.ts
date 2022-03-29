import Server, {publicDir} from "fullstacked/server";
import express from "express";

const server = new Server();

server.express.use("/docs*", express.static(publicDir));

server.start();
