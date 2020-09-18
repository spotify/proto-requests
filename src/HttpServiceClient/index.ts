// @ts-ignore
import { Method, Root, Service, Type} from 'protobufjs';
import { ClientConfig } from '../ClientConfig';
import { readFileSync } from 'fs';
import {
    getService,
    getTypes,
    getFullServiceName,
    getFullName,
} from '../utils/protobufUtils';
import {
    getTabsForDepth as gtd,
    getEntityNameFromNamespace,
    generateAnnotatedNamespaces,
    trimLeadingDot,
    generateNamespace,
} from "../utils/codeUtils";
import { fileHeader, polyfillFileHeader } from '../utils/fileHeader';
import { setupModule, declareObject, declareExport, exportDefault } from '../utils/moduleUtils';
import { startsWith } from "lodash";
import { WriteFunction, writeOutput, writeOutputSync } from '../utils/fileUtils';
import { Console } from '../types/console';

export interface CustomClass {
    filename: string;
    outputPath: string;
    fullName: string;
    contents?: string;
}

export type CustomClasses = Record<string, CustomClass>;

const CustomClasses: CustomClasses = {
    HttpServiceConfigOptions: {
        filename: require.resolve('./HttpServiceConfigOptions'),
        outputPath: 'protorequest/',
        fullName: 'protorequest.HttpServiceConfigOptions',
    },
};

const customResolvePath = (rootLocation: string, console: Console) => {
    return (origin: string, target: string): (string | null) => {
        console.log('customResolvePath rootLocation is: ', rootLocation);
        let result = "";
        if (target.startsWith(rootLocation)) {
            result = target;
        } else {
            result = `${rootLocation}${target}`;
        }
        console.log('customResolvePath returning: ', result);
        return result;
    };
};

export default class HttpServiceClient {
    root: Root;
    service: Service;
    methods: Method[];
    types: Type[];
    console: Console;

    constructor(
        file: string,
        options: ClientConfig,
        afterLoad: (error: Error, httpServiceClient: HttpServiceClient) => any,
        injectedConsole?: Console,
        ) {
        this.console = injectedConsole ? injectedConsole : console;
        const newRoot = new Root();
        newRoot.resolvePath = customResolvePath(options.rootLocation || '', this.console);
        newRoot.load(file, options, (err, root) => {
            if (err) {
                return afterLoad(err, null);
            }
            this.root = root;
            this.service = getService(this.root);
            this.types = getTypes(this.root);
            this.methods = this.service.methodsArray;
            return afterLoad(null, this);
        });
        return this;
    }

    getService = (): Service => {
        return getService(this.root);
    };

    generateCustomClasses = (): Record<string, CustomClass> => {
        const customClassesWithContents = {};
        Object.keys(CustomClasses).map((key) => {
            const filePath = CustomClasses[key].filename;
            const fileAsText = readFileSync(filePath).toString();
            const contents = `${polyfillFileHeader}
${fileAsText}`;
            customClassesWithContents[key] = { ...CustomClasses[key], contents };
        });
        return customClassesWithContents;
    };

    generateClient = (options): string => {
        const generatedClient = this.generateAnnotatedNamespacesForClient(options, this.root, '$root', 0);
        const serviceName = getService(this.root).name;
        return `
${fileHeader}

// Exported root namespace
${setupModule(options)}
${declareObject(options, "$root")}
${declareObject(options, serviceName)}
    
${generatedClient}

${exportDefault(options, '$root')}
${declareExport(options, "$root")}
${declareExport(options, serviceName)}
`;
    };

    generateProperties = (service: Service, methods: Method[], depth: number) => {
        return methods.map((method: Method) => {
            const trimmedMethodName = getEntityNameFromNamespace(method.name);
            return `${gtd(depth)}     * @property {function(${getFullName(this.root.lookupTypeOrEnum(method.requestType))}):Promise<${getFullName(this.root.lookupTypeOrEnum(method.responseType))}>} [${trimmedMethodName}] ${service.name} ${trimmedMethodName}`;
        }).join('\n');
    };

    generateService = (options, node, path, depth) => {
        const methodKeys = Object.keys(node.methods);
        const methodsArray = methodKeys.map(key => node.methods[key]);
        const generatedMethods = methodKeys.map(key => this.generateMethod(node.methods[key], node, path, options, depth)).join('');
        const properties = this.generateProperties(node, methodsArray, depth);
        const trimmedPath = trimLeadingDot(path);
        return `
${gtd(depth)}${getEntityNameFromNamespace(path)}.${node.name} = (function() {
${gtd(depth)}        
${gtd(depth)}    /**
${gtd(depth)}     * Properties of a ${node.name}.
${gtd(depth)}     * @memberof ${trimmedPath}
${gtd(depth)}     */
${gtd(depth)}     
${gtd(depth)}     /**
${gtd(depth)}      * Fetch function type, set when instantiating this service class.
${gtd(depth)}      * @callback FetchFunction
${gtd(depth)}      * @param {string} uri
${gtd(depth)}      * @param {Object} options
${gtd(depth)}      * @returns {Promise<any>}
${gtd(depth)}      */
${gtd(depth)}     
${gtd(depth)}    /**
${gtd(depth)}     * An HttpServiceClient class to send requests to the ${node.name}.
${gtd(depth)}     * @memberof ${trimmedPath}
${gtd(depth)}     * @classdesc ${node.name} to send requests to the ${node.name}.
${gtd(depth)}     * @param {FetchFunction} fetchFn
${gtd(depth)}     * @param {protorequest.HttpServiceConfigOptions} options
${gtd(depth)}     * @constructor
${gtd(depth)}     */
${gtd(depth)}    ${node.name} = function(fetchFn, options) {
${gtd(depth)}        this.fetchFn = fetchFn;
${gtd(depth)}        this.host = options.host;
${gtd(depth)}        this.baseUrl = options.baseUrl;
${gtd(depth)}        this.version = options.version || "";
${gtd(depth)}        this.headers = options.headers || new Headers();
${gtd(depth)}    };
${gtd(depth)}
${gtd(depth)}    /**
${gtd(depth)}     * Sends the fetch request decorated with the configured host.  Only for internal use.
${gtd(depth)}     */
${gtd(depth)}    ${node.name}.prototype.protoFetch = function(url, opts) {
${gtd(depth)}      return this.fetchFn(this.host + url, opts);
${gtd(depth)}    };
${gtd(depth)}
${gtd(depth)}    /**
${gtd(depth)}     * Sets the headers to be sent with all requests to this service.
${gtd(depth)}     * @function setHeaders
${gtd(depth)}     * @memberof ${trimmedPath}.${node.name}
${gtd(depth)}     * @param {Headers} headers
${gtd(depth)}     * @instance
${gtd(depth)}     * @returns {${trimmedPath}.${node.name}} ${node.name}
${gtd(depth)}     */
${gtd(depth)}    ${node.name}.prototype.setHeaders = function(headers) {
${gtd(depth)}      this.headers = headers;
${gtd(depth)}      return this;
${gtd(depth)}    };
${gtd(depth)}
${gtd(depth)}    /**
${gtd(depth)}     * Get the headers being sent with all requests to this service.
${gtd(depth)}     * @function getHeaders
${gtd(depth)}     * @memberof ${trimmedPath}.${node.name}
${gtd(depth)}     * @instance
${gtd(depth)}     * @returns {Headers}
${gtd(depth)}     */
${gtd(depth)}    ${node.name}.prototype.getHeaders = function() {
${gtd(depth)}      return this.headers;
${gtd(depth)}    };
${gtd(depth)}${generatedMethods}
${gtd(depth)}    return ${node.name};
${gtd(depth)}})();
`;
    };

    generateAnnotatedNamespacesForClient = (options, node, path, depth) => {
        const pathToLimitBy = `${getFullServiceName(this.root)}.`;
        const nodeHandlers = {
            service: this.generateService,
            enum: undefined,
            type:  undefined,
            field: undefined,
            method: undefined,
            root: undefined,
            namespace: (options, node, path, depth, nodeHandlers) => {
                // This code will keep us from publishing any empty namespaces that are referenced by the service's
                // proto file, but for whom we aren't generating any nodes.
                const fullPath = `${path}.${node.name}.`;
                const isARootWeShouldPublish = path === '$root' && startsWith(pathToLimitBy, `.${node.name}`);
                if (startsWith(pathToLimitBy, fullPath) || isARootWeShouldPublish) {
                    return generateNamespace(options, node, path, depth, nodeHandlers) || '';
                }
            },
        };
        return generateAnnotatedNamespaces(options, node, path, depth, nodeHandlers);
    };

    generateMethod = (method: Method, service: Service, namespace, options, depth) => {
        const trimmedNamespace = trimLeadingDot(namespace);
        return `
${gtd(depth)}    /**
${gtd(depth)}     * Calls ${service.name}.${method.name}
${gtd(depth)}     * @function ${method.name}
${gtd(depth)}     * @memberof ${trimmedNamespace}.${service.name}
${gtd(depth)}     * @param {${getFullName(this.root.lookupTypeOrEnum(method.requestType))}} request
${gtd(depth)}     * @instance
${gtd(depth)}     * @returns {Promise<${getFullName(this.root.lookupTypeOrEnum(method.responseType))}>} ${method.name}
${gtd(depth)}     */
${gtd(depth)}    ${service.name}.prototype.${method.name} = function(request) {
${gtd(depth)}        const url = '/' + this.baseUrl + '/${service.name}/' + this.version +  (this.version ? '/' : '') + '${method.name}';
${gtd(depth)}        const opts = {
${gtd(depth)}            method: 'POST',
${gtd(depth)}            body: JSON.stringify(request),
${gtd(depth)}            headers: this.headers
${gtd(depth)}        };
${gtd(depth)}        return this.protoFetch(url, opts)
${gtd(depth)}            .then(function(r) { return r.ok ? r.json() : Promise.reject(r); });
${gtd(depth)}    };
`;
    };
}
