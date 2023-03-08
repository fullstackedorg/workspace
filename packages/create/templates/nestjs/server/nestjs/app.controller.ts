import {Controller, Get, HttpException, HttpStatus} from '@nestjs/common';

@Controller('hello-nestjs')
export class AppController {
    @Get()
    helloWorld(): string {
        return 'Hello from NestJS';
    }

    @Get("error")
    error(): string {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
}
