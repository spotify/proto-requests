const { Config } = require("../dist/Config");

const testConfig = new Config();

testConfig.jsFile = "generated/compiled.js";
testConfig.tsFile = "generated/compiled.d.ts";
testConfig.libraryTarget = "esModule";
testConfig.buildersOutputFile = "generated/compiledWithBuilders.js";
testConfig.clientOutputDir = "generated/clients/";
testConfig.modelsOutputFile = "generated/models/models.js";
testConfig.modelsOutputDir = "generated/models/";
testConfig.customImports = [
    { defaultName: '', namedImports: [ 'com', 'google' ], importDefault: false, path: '../models/models' }
];
testConfig.rootLocation = "./proto/";
testConfig.protoFiles = [
    'com/test/testservice.proto',
];
testConfig.webgateHost = "https://www.testservice.com";
testConfig.webgateBaseUrl = "testservice/proto";
testConfig.webgateVersion = "v1";

export const config = testConfig;
