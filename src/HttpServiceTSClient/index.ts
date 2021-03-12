// @ts-ignore
import { Field, Method, Root, Service, Type } from 'protobufjs';
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
    getNestedNodes,
} from "../utils/codeUtils";
import { polyfillFileHeader } from '../utils/fileHeader';
import { includeCustomImports } from '../utils/moduleUtils';
import { startsWith } from "lodash";
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
        filename: require.resolve('./customclasses/HttpServiceConfigOptions.ts'),
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

export default class HttpServiceTSClient {
    root: Root;
    service: Service;
    methods: Method[];
    types: Type[];
    console: Console;

    constructor(
        file: string,
        options: ClientConfig,
        afterLoad: (error: Error, httpServiceClient: HttpServiceTSClient) => any,
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
            const contents = fileAsText;
            customClassesWithContents[key] = { ...CustomClasses[key], contents };
        });
        return customClassesWithContents;
    };

    generateClient = (options): string => {
        const generatedClient = this.generateAnnotatedNamespacesForClient(options, this.root, '$root', 0);
        return `${includeCustomImports(options)}
import { HttpServiceConfigOptions } from './protorequest/HttpServiceConfigOptions';
${generatedClient}`;
    };

    generateProperties = (service: Service, methods: Method[], depth: number) => {
        return methods.map((method: Method) => {
            const trimmedMethodName = getEntityNameFromNamespace(method.name);
            return `${gtd(depth)}     * @property {function(${getFullName(this.root.lookupTypeOrEnum(method.requestType))}):Promise<${getFullName(this.root.lookupTypeOrEnum(method.responseType))}>} [${trimmedMethodName}] ${service.name} ${trimmedMethodName}`;
        }).join('\n');
    };

    generateService = (options, node, path, depth) => {
        const methodKeys = Object.keys(node.methods);
        const generatedMethods = methodKeys.map(key => this.generateMethod(node.methods[key], node, path, options, depth)).join('');
        const trimmedPath = trimLeadingDot(path);
        return `
${gtd(depth)}export class ${node.name} {
${gtd(depth)}
${gtd(depth)}    fetchFn: (requestInfo: RequestInfo, options?: RequestInit) => Promise<Response>;
${gtd(depth)}    host: string;
${gtd(depth)}    baseUrl: string;
${gtd(depth)}    version: string;
${gtd(depth)}    headers: Headers;
${gtd(depth)}    
${gtd(depth)}    constructor(fetchFn, options: HttpServiceConfigOptions) {
${gtd(depth)}        this.fetchFn = fetchFn;
${gtd(depth)}        this.host = options.host;
${gtd(depth)}        this.baseUrl = options.baseUrl;
${gtd(depth)}        this.version = options.version || "";
${gtd(depth)}        this.headers = options.headers || new Headers();
${gtd(depth)}    }
${gtd(depth)}
${gtd(depth)}    /**
${gtd(depth)}     * Sends the fetch request decorated with the configured host.  Only for internal use.
${gtd(depth)}     */
${gtd(depth)}    protoFetch = (url: string, opts?: RequestInit): Promise<Response> => {
${gtd(depth)}      return this.fetchFn(this.host + url, opts);
${gtd(depth)}    };
${gtd(depth)}
${gtd(depth)}    /**
${gtd(depth)}     * Sets the headers to be sent with all requests to this service.
${gtd(depth)}     */
${gtd(depth)}    setHeaders = (headers: Headers): ${node.name} => {
${gtd(depth)}      this.headers = headers;
${gtd(depth)}      return this;
${gtd(depth)}    };
${gtd(depth)}
${gtd(depth)}    /**
${gtd(depth)}     * Get the headers being sent with all requests to this service.
${gtd(depth)}     */
${gtd(depth)}    getHeaders = (): Headers => {
${gtd(depth)}      return this.headers;
${gtd(depth)}    };
${gtd(depth)}${generatedMethods}
${gtd(depth)}}
`;
    };

    recurseThroughNamespace = (options, node, path, depth, nodeHandlers) => {
        const nestedNodes = getNestedNodes(node);
        if (node instanceof Field || node instanceof Service || node instanceof Method) {
            console.log('Something went wrong, we found an unexpected nested node');
            throw new Error('Something went wrong, we found an unexpected nested node');
        }
        path = path.replace('$root', '');
        return `${nestedNodes.map(nestedNode => generateAnnotatedNamespaces(options, nestedNode, `${path}.${node.name}`, depth, nodeHandlers)).join('')}`;
    }

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
                    return this.recurseThroughNamespace(options, node, path, depth, nodeHandlers) || '';
                }
            },
        };
        return generateAnnotatedNamespaces(options, node, path, depth, nodeHandlers);
    };

    generateMethod = (method: Method, service: Service, namespace, options, depth) => {
        return `
${gtd(depth)}    ${method.name} = (request: ${getFullName(this.root.lookupTypeOrEnum(method.requestType))}): Promise<${getFullName(this.root.lookupTypeOrEnum(method.responseType))}> => {
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
