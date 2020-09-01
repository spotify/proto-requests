export class Config {
    jsFile: string;
    tsFile: string;
    libraryTarget: string;
    buildersOutputFile: string;
    clientOutputFile: string;
    modelsOutputFile: string;
    modelsOutputDir: string;
    protoFiles: Array<string>;
    webgateHost: string;
    webgateBaseUrl: string;
    webgateVersion: string;
    rootLocation: string;

    constructor() {
        this.jsFile = null;
        this.tsFile = null;
        this.libraryTarget = null;
        this.buildersOutputFile = null;
        this.clientOutputFile = null;
        this.modelsOutputFile = null;
        this.modelsOutputDir = null;
        this.protoFiles = [];
        this.webgateHost = null;
        this.webgateBaseUrl = null;
        this.webgateVersion = null;
        this.rootLocation = null;
    }
}
