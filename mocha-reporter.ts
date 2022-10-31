import Mocha, {Runner} from "mocha";

module.exports = specExt;

function specExt(runner: Runner){
    runner.on(Mocha.Runner.constants.EVENT_RUN_END, function() {
        if(process.argv.includes("--test-mode")) return;

        if(!global.integrationTests)
            global.integrationTests = {passes: 0, failures: 0};

        runner.stats.passes += global.integrationTests.passes;
        runner.stats.failures += global.integrationTests.failures;
    });

    Mocha.reporters.Spec.call(this, runner);

    const passTestListeners = runner.listeners(Mocha.Runner.constants.EVENT_TEST_PASS);
    runner.removeAllListeners(Mocha.Runner.constants.EVENT_TEST_PASS);
    runner.on(Mocha.Runner.constants.EVENT_TEST_PASS, (test) => {
        if(test.title.startsWith("Integration"))
            return;

        passTestListeners.forEach(listener => {
            listener(test);
        });
    });
}

(Mocha.utils as any).inherits(specExt, Mocha.reporters.Spec);
