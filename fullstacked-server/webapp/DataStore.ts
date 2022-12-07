import {fetch} from "fullstacked/webapp/fetch";

export class DataStore {
    static store: any = {};

    static async getIP(){
        if(!this.store.ip)
            this.store.ip = fetch.get("/ip");

        return this.store.ip;
    }

    static async getAppsIDs(){
        if(!this.store.appsIDs)
            this.store.appsIDs = fetch.get("/apps");

        return this.store.appsIDs;
    }

    static async getApp(appID){
        if(!this.store.apps)
            this.store.apps = new Map();

        let app = this.store.apps.get(appID)
        if(!app) {
            app = fetch.get(`/apps/${appID}`);
            this.store.apps.set(appID, app);
        }

        return app;
    }

}
