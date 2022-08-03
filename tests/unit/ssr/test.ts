import {describe} from "mocha";
import ssrTest from "./ssrTest";
import {equal} from "assert";


describe("Unit SSR", function(){
    it("Should render to string a div", function(){
        equal(ssrTest(), "<div></div>");
    });
});
