const { config } = require('../test-dist/config');
const { ClientConfig } = require('../dist/ClientConfig');
const protoRequest = require('../dist').default;

const clientConfig = new ClientConfig();

clientConfig.keepCase = true;
clientConfig.longs = String;
clientConfig.enums = String;
clientConfig.defaults = true;
clientConfig.oneofs = true;
clientConfig.rootLocation = config.rootLocation;
clientConfig.async = true;

new protoRequest.TSModels(config.protoFiles, clientConfig, (err, client) => {
  if (err) {
    console.error(`Error loading proto files:\n${err}`);
    return;
  }

  client.generateModels({ ...config, async: true, compileWithBuilders: true });
});
