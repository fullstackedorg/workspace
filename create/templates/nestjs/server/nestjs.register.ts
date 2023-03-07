import {BaseExceptionFilter} from '@nestjs/core';
import { Catch, HttpException, ArgumentsHost, NotFoundException, NestApplicationOptions } from '@nestjs/common';
import Server from "fullstacked/server";

export default function (nestjs){
    nestjs.useGlobalFilters(new HttpExceptionFilter(nestjs.getHttpAdapter()));

    const {handler, resolver} = Server.promisify(nestjs.getHttpAdapter().getInstance());
    HttpExceptionFilter.resolver = resolver;
    Server.listeners.push({
        title: "NestJS",
        handler
    });
}

@Catch(HttpException)
class HttpExceptionFilter extends BaseExceptionFilter {
    static resolver;
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        if(exception instanceof NotFoundException && HttpExceptionFilter.resolver)
            return HttpExceptionFilter.resolver(request, response);
        else
            super.catch(exception, host);
    }
}
