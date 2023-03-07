import testIntegration from "fullstacked/utils/testIntegration";
import {describe, it} from "mocha";
import SQLite3 from "../server/sqlite3";
import {deepEqual} from "assert";

testIntegration(describe("SQLite3 Template Tests", function(){

    it("Should run sqlite3", () => {
        const sqliteDB = new SQLite3().getDB();

        const ids = [];
        const infos = [];

        sqliteDB.serialize(() => {
            sqliteDB.run("CREATE TABLE lorem (info TEXT)");

            const stmt = sqliteDB.prepare("INSERT INTO lorem VALUES (?)");
            for (let i = 0; i < 10; i++) {
                stmt.run("Ipsum " + i);
            }
            stmt.finalize();

            sqliteDB.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
                ids.push(row.id);
                infos.push(row.info + 1);
            });
        });
        sqliteDB.close();

        deepEqual(ids, infos);
    });

}));
