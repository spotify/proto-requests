export class Config {
    jsFile: string;
    tsFile: string;
    libraryTarget: LibraryTarget;
    buildersOutputFile: string;
    clientOutputFile: string;
    modelsOutputFile: string;
    modelsOutputDir: string;
    protoFiles: Array<string>;
    webgateHost: string;
    webgateBaseUrl: string;
    webgateVersion: string;
    rootLocation: string;
    customImports: Array<CustomImport>;

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
        this.customImports = [];
    }
}

export enum LibraryTarget {
    COMMONJS= 'commonjs',
    COMMONJS2 = 'commonjs2',
    MODULE = 'module',
    ESMODULE = 'esModule',
}

export class CustomImport {
    path: string;
    defaultName: string;
    importDefault: boolean;
    namedImports: string[];
}
