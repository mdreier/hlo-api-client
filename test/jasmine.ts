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

export default jasmine;
export { describe, it }