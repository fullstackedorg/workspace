import {Controller, Get} from '@nestjs/common';

@Controller('hello-world')
export class AppController {
    @Get()
    helloWorld(): string {
        return 'Hello World';
    }
}
