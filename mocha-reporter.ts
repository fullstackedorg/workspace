import Mocha, {Runner} from "mocha";

module.exports = specExt;

function specExt(runner: Runner){
    Mocha.reporters.Spec.call(this, runner);
}
