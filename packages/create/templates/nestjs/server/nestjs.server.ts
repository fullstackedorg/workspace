import Server from "@fullstacked/webapp/server"
import {NestFactory} from '@nestjs/core';
import {AppModule} from "./nestjs/app.module";


const nestjs = await NestFactory.create(AppModule, {});

Server.addListener("/nestjs", {
    name: "NestJS",
    handler: nestjs.getHttpAdapter().getInstance()
});

await nestjs.init();

