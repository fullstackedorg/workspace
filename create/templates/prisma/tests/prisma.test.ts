import {before, after, describe, it} from "mocha";
import {equal, ok} from "assert";
import testIntegration from "fullstacked/utils/testIntegration";
import Prisma from "../server/prisma";

testIntegration(describe("Prisma Template Tests", async function(){
    before(function() {
        this.timeout(100000);
        return Prisma.init(!process.argv.includes("--debug"))
    })

    it('Should create, read, delete in db', async function(){
        const name = "test";
        await Prisma.client.example.create({
            data: {
                name
            }
        });
        ok((await Prisma.client.example.findMany()).find(item => item.name === name));
        await Prisma.client.example.delete({
            where: {
                name
            }
        });
        equal((await Prisma.client.example.findMany()).length, 0);
    });

    after(() => Prisma.close())
}));
