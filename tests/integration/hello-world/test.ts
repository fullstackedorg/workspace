import {before, describe} from "mocha";
import {equal} from "assert";
import Helper from "fullstacked/tests/integration/Helper";
import server from "./server";
import axios from "axios";

Helper(
    describe("Hello World", function(){
        before(async function (){
            server.start({silent: true, testing: true})
        });

        it('Should hit hello world endpoint', async function(){
            const response = await axios.get("/hello-world");
            equal(response.data, "Hello World");
        });

        it('Should hit hello world endpoint failing', async function(){
            const response = await axios.get("/hello-world");
            equal(response.data, "Hello World2");
        });

        after(async function(){
            server.stop();
        });
    })
);

