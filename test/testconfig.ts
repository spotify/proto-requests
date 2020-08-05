const { Config } = require("../dist/Config");

const testConfig = new Config();

testConfig.jsFile = "generated/compiled.js";
testConfig.tsFile = "generated/compiled.d.ts";
testConfig.libraryTarget = "esModule";
testConfig.buildersOutputFile = "generated/compiledWithBuilders.js";
testConfig.clientOutputDir = "generated/";
testConfig.modelsOutputFile = "generated/models.js";
testConfig.modelsOutputDir = "generated/";
testConfig.rootLocation = "/Users/keithgould/src/proto-request/testproto/";
testConfig.protoFiles = [
    'com/spotify/adstudiobff/testservice.proto',
];
testConfig.webgateHost = "https://exp.wg.spotify.com";
testConfig.webgateBaseUrl = "adstudio-bff/proto";
testConfig.webgateVersion = "v1";

export const config = testConfig;
