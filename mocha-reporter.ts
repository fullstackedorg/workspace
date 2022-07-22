import Mocha, {Runner} from "mocha";

module.exports = specExt;

function specExt(runner: Runner){
    runner.on('end', function() {
        if(process.argv.includes("--test-mode")) return;

        if(!global.integrationTests)
            global.integrationTests = {passes: 0, failures: 0};

        runner.stats.passes += global.integrationTests.passes;
        runner.stats.failures += global.integrationTests.failures;
    });

    Mocha.reporters.Spec.call(this, runner);
}

(Mocha.utils as any).inherits(specExt, Mocha.reporters.Spec);
