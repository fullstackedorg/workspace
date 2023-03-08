import { createClient } from '@redis/client';

export default class Redis {
    static client = createClient({url: 'redis://redis:6379'});

    static connect(){
        return Redis.client.connect();
    }

    static close(){
        return this.client.quit();
    }
}
