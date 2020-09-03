const { Config: Testconfig } = require("../dist/Config");

const testConfig = new Testconfig();

testConfig.jsFile = "generated/compiled.js";
testConfig.tsFile = "generated/compiled.d.ts";
testConfig.libraryTarget = "esModule";
testConfig.buildersOutputFile = "generated/compiledWithBuilders.js";
testConfig.clientOutputDir = "generated/";
testConfig.modelsOutputFile = "generated/models.js";
testConfig.modelsOutputDir = "generated/";
testConfig.rootLocation = "./proto/";
testConfig.protoFiles = [
    'com/test/testservice.proto',
];
testConfig.webgateHost = "https://www.testservice.com";
testConfig.webgateBaseUrl = "testservice/proto";
testConfig.webgateVersion = "v1";

export const config = testConfig;
