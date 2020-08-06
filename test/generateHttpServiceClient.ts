const { writeOutput } = require('../dist/utils/fileUtils');
const { config } = require('../test-dist/testconfig');
const { ClientConfig } = require('../dist/ClientConfig');
const protoRequest = require('../dist').default;

const clientConfig = new ClientConfig();

clientConfig.keepCase = true;
clientConfig.longs = String;
clientConfig.enums = String;
clientConfig.defaults = true;
clientConfig.oneofs = true;
clientConfig.rootLocation = config.rootLocation;

const generateCustomClasses = (fileLocation) => {
    console.log('writing custom classes for http service client');
    new protoRequest.HttpServiceClient(fileLocation, clientConfig, (err, client) => {
        if (err) {
            console.error(`Error loading proto files:\n${err}`);
            return;
        }

        const customClasses = client.generateCustomClasses();
        Object.keys(customClasses).forEach(className => {
            const customClass = customClasses[className];
            const outputPath = customClasses[className].outputPath;
            const outputFileName = `${config.clientOutputDir}${outputPath}${className}.js`;
            writeOutput(outputFileName, customClass.contents);
        });
    });
};

const generateHttpServiceClient = (fileLocation) => {
    console.log('writing http service client for: ', fileLocation);
    new protoRequest.HttpServiceClient(fileLocation, clientConfig, (err, client) => {
        if (err) {
            console.error(`Error loading proto files:\n${err}`);
            return;
        }

        const generatedClientCode = client.generateClient(config);

        const shortServiceName = client.getService().name;
        const outputFileName = `${config.clientOutputDir}${shortServiceName}.js`;
        writeOutput(outputFileName, generatedClientCode);
    });
};

generateCustomClasses(config.protoFiles[0]);
config.protoFiles.forEach(fileLocation => generateHttpServiceClient(fileLocation));
