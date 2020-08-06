import { join } from 'path';
import { config as defaultConfig } from '../../../test/config';
import { ClientConfig } from '../../ClientConfig';
import SplitModels from '../index';

let config;
try {
    config = require('../../../test/config').config;
} catch (ex) {
    console.log('no local config found, using testconfig.');
    config = defaultConfig;
}

describe('SplitModels', () => {
    const allFiles = {};

    beforeAll(() => {
        const clientConfig = new ClientConfig();
        const mockConsole = {
            log: jest.fn()
        };
        clientConfig.keepCase = true;
        clientConfig.defaults = true;
        clientConfig.oneofs = true;
        clientConfig.rootLocation = join(__dirname, "/../../../proto/");
        clientConfig.async = true;
        config.protoFiles = [
            'com/test/models.proto',
            'com/test/testservice.proto',
        ];

        return new Promise((resolve, reject) => {
            new SplitModels(config.protoFiles, clientConfig, (err, client) => {
                if (err) {
                    const error = `Error loading proto files:\n${err}`;
                    console.error(error);
                    reject(error);
                    return;
                }

                client.generateModels({ ...config, async: true, compileWithBuilders: true });
                resolve();
            }, (fileName, content) => {
                allFiles[fileName] = content;
            }, mockConsole);
        });
    });

    it('generated file snapshots', () => {
        Object.keys(allFiles).forEach(fileName => {
            const fileContents = allFiles[fileName];
            expect(fileContents).toMatchSnapshot(fileName);
        });
    });
});