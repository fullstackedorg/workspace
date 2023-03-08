import {MongoClient} from 'mongodb';

export default class Mongo {
    static username: string = "username";
    static password: string = "password";
    static client: MongoClient;

    static async connect() {
        this.client = await MongoClient.connect(`mongodb://${this.username}:${this.password}@mongo:27017`);
    }

    static close(){
        return this.client.close()
    }
}
