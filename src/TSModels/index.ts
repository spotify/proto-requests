// @ts-ignore
import { Method, Root, Service, Type, Enum, Field } from 'protobufjs';
import { Console } from '../types/console';
import {
  getFullName,
  getService,
  getServiceMethods,
  getTypes,
} from '../utils/protobufUtils';
import {
  getTabsForDepth as gtd,
  generateAnnotatedNamespaces,
  getNestedNodes,
  trimLeadingDot,
} from '../utils/codeUtils';
import { protoPrimitiveTypesToTsTypes, typeDefaults } from '../utils/types';
import { WriteFunction, writeOutput, writeOutputSync } from '../utils/fileUtils';
import { ClientConfig } from '../ClientConfig';
import polyfills from './polyfills/index';

const customResolvePath = (rootLocation: string, console: Console) => {
  return (origin: string, target: string): string | null => {
    console.log('customResolvePath rootLocation is: ', rootLocation);
    let result = '';
    if (target.startsWith(rootLocation)) {
      result = target;
    } else {
      result = `${rootLocation}${target}`;
    }
    console.log('customResolvePath returning: ', result);
    return result;
  };
};

export default class TSModels {
  root: Root;
  service: Service;
  methods: Method[];
  types: Type[];
  addToFile: (content: string) => void;
  writeFn: WriteFunction;
  console: Console;
  fileContent: string;

  constructor(
    file: string,
    options: ClientConfig,
    afterLoad: (error: Error, SimpleClient) => any,
    writeFunction?: WriteFunction,
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
      this.methods = getServiceMethods(this.service);
      this.writeFn = writeFunction || (options.async ? writeOutput : writeOutputSync);
      this.fileContent = '';
      this.addToFile = (content: string) => {
        this.fileContent += content;
      };
      return afterLoad(null, this);
    });
    return this;
  }

  getPolyfill = (node, path) => {
    const nodeName = trimLeadingDot(`${path}.${node.name}`);
    const polyfillKey = Object.keys(polyfills).find(key => {
      return polyfills[key] && polyfills[key].fullName === nodeName;
    });
    return polyfillKey && polyfills[polyfillKey];
  };

  generateTSNamespace = (options, node, path, depth, nodeHandlers) => {
    const nestedNodes = getNestedNodes(node);
    if (node instanceof Field || node instanceof Service || node instanceof Method) {
      console.log('Something went wrong, we found an unexpected nested node');
      throw new Error('Something went wrong, we found an unexpected nested node');
    }
    path = path.replace('$root', '');
    const namespaceContent =
`${depth === 0 ? '': '\n'}${gtd(depth)}export namespace ${node.name} {
${nestedNodes.map(nestedNode => generateAnnotatedNamespaces(options, nestedNode, `${path}.${node.name}`, depth + 1, nodeHandlers)).join('')}
${gtd(depth)}}
${depth === 0 ? '\n': ''}`;
    return namespaceContent;
    // this.addToFile(namespaceContent);
  };

  generateModels = options => {

    const nodeHandlers = {
      service: undefined,
      enum: (options, node, path, depth) => {
        const polyfill = this.getPolyfill(node, path);
        if (polyfill) {
          this.console.log(
            `Polyfilling enum for ${path}.${node.name}`,
          );
          return polyfill.contents;
          // this.addToFile(polyfill.contents);
        } else {
          return this.generateEnum(options, node, path, depth) || '';
        }
      },
      type: (options, node, path, depth, nodeHandlers) => {
        const polyfill = this.getPolyfill(node, path);
        if (polyfill) {
          this.console.log(
            `Polyfilling type for ${path}.${node.name}`,
          );
          return polyfill.contents;
          // this.addToFile(polyfill.contents);
        } else {
          return this.generateType(options, node, path, depth, nodeHandlers) || ''
        }
      },
      field: undefined,
      method: undefined,
      root: undefined,
      namespace: this.generateTSNamespace,
    };
    const content = generateAnnotatedNamespaces(options, this.root, '$root', 0, nodeHandlers);

    const modelFile =
        options.modelsOutputDir + 'models.d.ts';

    this.writeFn(modelFile, content);
  };

  getNodeType = node => {
    let tsType = protoPrimitiveTypesToTsTypes[node.type];
    if (!tsType) {
      tsType = getFullName(this.root.lookupTypeOrEnum(node.type));
    }
    if (node.repeated) {
      return `Array<${tsType}>`;
    } else {
      return `${tsType}`;
    }
  };

  getDefaultForType = (type, repeated) => {
    if (repeated) return '[]';
    if (typeDefaults[type] === undefined) {
      return '{}';
    } else {
      return typeDefaults[type];
    }
  };

  generateField = (node, parentNode, path, depth) => {
    if (!node.name || node.name.includes('.')) {
      // TODO: For some reason some weird fields are being added with dot namespaces. Possibly an issue with
      // protobufjs?  Best move for now is to just drop them.
      return '';
    }
    return `${gtd(depth)}    ${node.name}: ${this.getNodeType(node)};`;
  };

  generateType = (options, node, path, depth, nodeHandlers) => {
    const nestedNodes = getNestedNodes(node);
    const nestedCodeBlocks = [];
    nestedNodes.forEach(nestedNode => {
      if (nestedNode instanceof Type) {
        nestedCodeBlocks.push(
          this.generateType(
            options,
            nestedNode,
            `${path}.${node.name}`,
            depth + 1,
            nodeHandlers,
          ),
        );
      }
      if (nestedNode instanceof Enum) {
        nestedCodeBlocks.push(
          this.generateEnum(
            options,
            nestedNode,
            `${path}.${node.name}`,
            depth + 1,
          ),
        );
      }
    });
    const nestedCode = nestedCodeBlocks.length === 0 ? '' : `

${gtd(depth)}export namespace ${node.name} {
${gtd(depth)}
${nestedCodeBlocks.join('\n')}
${gtd(depth)}}
`;

    return `${gtd(depth)}export interface ${node.name} {
${Object.keys(node.fields).map((key) => {
  return `${this.generateField(node.fields[key], node, path, depth)}`;
}).join('\n')}
${gtd(depth)}}${nestedCode}
`;
  };

  generateEnum = (options, node, path, depth) => {
    return `${gtd(depth)}export enum ${node.name} {
${Object.keys(node.values).map((key) => {
  return `${gtd(depth)}    ${key} = '${key}',`;
}).join('\n')}
${gtd(depth)}}
`;
  };
}
