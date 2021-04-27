import Jasmine from "jasmine"
import JasmineConsoleReporter from "jasmine-console-reporter"

const jasmine = new Jasmine({});
jasmine.loadConfigFile("./spec/support/jasmine.json");

jasmine.env.clearReporters();
jasmine.env.addReporter(new JasmineConsoleReporter({
    colors: true,
    cleanStack: true,
    verbosity: 4,
    listStyle: "indent",
    activity: false
}));

const describe = jasmine.env.describe;
const it = jasmine.env.it;
const afterAll = jasmine.env.afterAll;
const afterEach = jasmine.env.afterEach;
const beforeAll = jasmine.env.beforeAll;
const beforeEach = jasmine.env.beforeEach;

export { jasmine as default, describe, it, afterAll, afterEach, beforeAll, beforeEach }