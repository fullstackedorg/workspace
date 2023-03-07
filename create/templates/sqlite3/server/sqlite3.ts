import sqlite3 from "sqlite3";
import {resolve} from "path";

export default class SQLite3 {
    dbFile: string = resolve("/", "tmp", "db.db");
    db: sqlite3.Database = null;

    getDB(): sqlite3.Database {
        if(!this.db)
            this.db = new sqlite3.Database(this.dbFile)

        return this.db;
    }
}
