import {it, Suite} from "mocha";

export default function testIntegration(testSuite: Suite){
    if(process.argv.includes("--testing"))
        return;

    if(!global.integrationTests)
        global.integrationTests = {passes: 0, failures: 0};

    testSuite.tests = [];

    it(`Integration [${testSuite.title}]`, async function(){
        this.timeout(10000000)
        await (await import("./testIntegrationRunner.js")).default(testSuite);
    });
}


