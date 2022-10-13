// import {before, describe} from "mocha";
// import {equal} from "assert";
// import Helper from "fullstacked/tests/integration/Helper";
// import server from "./server/index";
//
// Helper(describe("Hello World", function(){
//     before(async function (){
//         server.start({silent: true, testing: true})
//     });
//
//     it('Should hit hello world endpoint', async function(){
//         const res = await fetch("http://localhost/hello-world");
//         equal(await res.text(), "Hello World");
//     });
//
//     after(async function(){
//         server.stop();
//     });
// }), __dirname);
