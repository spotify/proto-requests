import { join } from 'path';
import { config as defaultConfig } from '../../../test/testconfig';
import { ClientConfig } from '../../ClientConfig';
import HttpServiceTSClient, { CustomClasses } from '../index';

let config;
try {
    config = require('../../../test/config').config;
} catch (ex) {
    console.log('no local config found, using testconfig.');
    config = defaultConfig;
}

const testFile = 'com/test/testservice.proto';

describe('HttpServiceTSClient', () => {
    let httpServiceTSClient: HttpServiceTSClient;
    let customClasses: CustomClasses = {};

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

        return new Promise((resolve, reject) => {
            new HttpServiceTSClient(testFile, clientConfig, (err, client) => {
                if (err) {
                    const error = `Error loading proto files:\n${err}`;
                    console.error(error);
                    reject(error);
                    return;
                }

                customClasses = client.generateCustomClasses();
                httpServiceTSClient = client;
                resolve();
            }, mockConsole);
        });
    });

    it('testservice client snapshot', () => {
        const fileContents = httpServiceTSClient.generateClient(config);
        expect(fileContents).toMatchSnapshot();
    });

    it('testservice custom classes snapshot', () => {
        Object.keys(customClasses).forEach((key: string) => {
            const fileContents = customClasses[key];
            expect(fileContents.contents).toMatchSnapshot(key);
        });
    });
});
