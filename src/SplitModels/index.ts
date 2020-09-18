// @ts-ignore
import { Method, Root, Service, Type, Enum } from 'protobufjs';
import { Console } from '../types/console';
import { upperFirst, startsWith } from 'lodash';
import {
  getFullName,
  getService,
  getServiceMethods,
  getTypes,
} from '../utils/protobufUtils';
import {
  getTabsForDepth as gtd,
  getEntityNameFromNamespace,
  generateAnnotatedNamespaces,
  generateNamespace,
  getNestedNodes,
  getAllNestedChildNodes,
  trimLeadingDot,
} from '../utils/codeUtils';
import { protoPrimitiveTypesToTsTypes, typeDefaults } from '../utils/types';
import { WriteFunction, writeOutput, writeOutputSync } from '../utils/fileUtils';
import { ClientConfig } from '../ClientConfig';
import polyfills from './polyfills/index';
import { fileHeader } from '../utils/fileHeader';
import {
  setupModule,
  declareObjects,
  declareExports,
  exportDefault,
} from '../utils/moduleUtils';

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

export default class SplitModels {
  root: Root;
  service: Service;
  methods: Method[];
  types: Type[];
  writeFn: WriteFunction;
  console: Console;

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

  buildModelForEnumOrType = (options, node, path, depth) => {
    const nodeToBuild = node.name;
    const fullNodeNameToBuild = `.${getFullName(node)}`;
    const pathToLimitBy = `${path}.`;
    const nodeHandlers = {
      service: undefined,
      enum: (options, node, path, depth, nodeHandlers) => {
        if (node.name == nodeToBuild) {
          return this.generateEnum(options, node, path, depth) || '';
        }
      },
      type: (options, node, path, depth, nodeHandlers) => {
        const fullNodeName = `${path}.${node.name}`;
        if (fullNodeName === fullNodeNameToBuild) {
          // This is the message we are trying to build
          return (
            this.generateType(options, node, path, depth, nodeHandlers) || ''
          );
        }
      },
      field: undefined,
      method: undefined,
      root: undefined,
      namespace: (options, node, path, depth, nodeHandlers) => {
        // This code will keep us from publishing any empty namespaces that are referenced by the model's
        // proto file, but for whom we aren't generating any nodes.
        const fullPath = `${path}.${node.name}.`;
        const isARootWeShouldPublish =
          path === '$root' && startsWith(pathToLimitBy, `.${node.name}`);
        if (startsWith(pathToLimitBy, fullPath) || isARootWeShouldPublish) {
          return (
            generateNamespace(options, node, path, depth, nodeHandlers) || ''
          );
        }
      },
    };
    const generatedModels = generateAnnotatedNamespaces(
      options,
      this.root,
      '$root',
      0,
      nodeHandlers,
    );
    const allNestedNodeChildrenNames = getAllNestedChildNodes([node]).map(
      child => child.name,
    );
    const fileContent = `${fileHeader}
${setupModule(options)}
${declareObjects(options, [
  '$root',
  nodeToBuild,
  ...allNestedNodeChildrenNames,
])}
${generatedModels}
${declareExports(options, [
  '$root',
  nodeToBuild,
  ...allNestedNodeChildrenNames,
])}
${exportDefault(options, '$root')}
`;

    var modelFile =
      options.modelsOutputDir +
      `${path.replace(/\./g, '/')}` +
      '/' +
      `${node.name}` +
      '.js';
    this.writeFn(modelFile, fileContent);
  };

  generateModels = options => {
    const nodeHandlers = {
      service: undefined,
      enum: (options, node, path, depth) => {
        const polyfill = this.getPolyfill(node, path);
        if (polyfill) {
          const modelFile =
            options.modelsOutputDir +
            `${path.replace(/\./g, '/')}` +
            '/' +
            `${node.name}` +
            '.js';
          this.console.log(
            `Polyfilling enum for ${path}.${node.name} to: ${modelFile}`,
          );
          this.writeFn(modelFile, polyfill.contents);
        } else {
          this.buildModelForEnumOrType(options, node, path, depth);
        }
      },
      type: (options, node, path, depth, nodeHandlers) => {
        const polyfill = this.getPolyfill(node, path);
        if (polyfill) {
          const modelFile =
            options.modelsOutputDir +
            `${path.replace(/\./g, '/')}` +
            '/' +
            `${node.name}` +
            '.js';
          this.console.log(
            `Polyfilling type for ${path}.${node.name} to: ${modelFile}`,
          );
          this.writeFn(modelFile, polyfill.contents);
        } else {
          this.buildModelForEnumOrType(options, node, path, depth);
        }
      },
      field: undefined,
      method: undefined,
      root: undefined,
      namespace: undefined,
    };
    generateAnnotatedNamespaces(options, this.root, '$root', 0, nodeHandlers);
  };

  getNodeType = node => {
    let tsType = protoPrimitiveTypesToTsTypes[node.type];
    if (!tsType) {
      tsType = getFullName(this.root.lookupTypeOrEnum(node.type));
    }
    if (node.repeated) {
      return `Array.<${tsType}>`;
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

  generateSetter = (node, parentNode, path, depth) => {
    const returnType = getFullName(this.root.lookupTypeOrEnum(parentNode.name));
    return `
${gtd(depth)}    /**
${gtd(depth)}     * Sets ${node.name}
${gtd(depth)}     * @function set${upperFirst(
      getEntityNameFromNamespace(node.name),
    )}
${gtd(depth)}     * @memberof ${trimLeadingDot(path)}.${parentNode.name}
${gtd(depth)}     * @param {${this.getNodeType(node)}} value
${gtd(depth)}     * @instance
${gtd(depth)}     * @returns {${returnType}} ${parentNode.name}
${gtd(depth)}     */
${gtd(depth)}    ${parentNode.name}.prototype.set${upperFirst(
      getEntityNameFromNamespace(node.name),
    )} = function(value) {
${gtd(depth)}        this['${getEntityNameFromNamespace(node.name)}'] = value;
${gtd(depth)}        return this;
${gtd(depth)}    };`;
  };

  generateField = (node, parentNode, path, depth) => {
    return `
${gtd(depth)}    /**
${gtd(depth)}     * ${parentNode.name} ${node.name}.
${gtd(depth)}     * @member {${this.getNodeType(node)}} ${node.name}
${gtd(depth)}     * @memberof ${trimLeadingDot(path)}.${parentNode.name}
${gtd(depth)}     * @instance
${gtd(depth)}     */
${gtd(depth)}    ${parentNode.name}.prototype.${getEntityNameFromNamespace(
      node.name,
    )} = ${this.getDefaultForType(node.type, node.repeated)};`;
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

    const trimmedPath = trimLeadingDot(path);
    const allProperties = Object.keys(node.fields)
      .map(key => {
        const field = node.fields[key];
        const line = `${gtd(depth)}     * @property {${this.getNodeType(
          field,
        )}|null} [${getEntityNameFromNamespace(field.name)}] ${
          node.name
        } ${getEntityNameFromNamespace(field.name)}`;
        return line;
      })
      .join('\n');
    let allFields = '';
    if (options.compileWithBuilders) {
      allFields = Object.keys(node.fields)
        .map(key => {
          const field = node.fields[key];
          const line = `${gtd(depth)}     * @property {${this.getNodeType(
            field,
          )}|null} [set${upperFirst(getEntityNameFromNamespace(field.name))}] ${
            node.name
          } set${upperFirst(getEntityNameFromNamespace(field.name))}`;
          return line;
        })
        .join('\n');
    }
    return `
${gtd(depth)}${node.parent.name}.${node.name} = (function() {
${gtd(depth)}    /**
${gtd(depth)}     * Properties of a ${node.name}.
${gtd(depth)}     * @memberof ${trimLeadingDot(path)}
${gtd(depth)}     * @interface I${node.name}
${allProperties ? allProperties : ''}
${allFields ? allFields : ''}
${gtd(depth)}     */
${gtd(depth)}    
${gtd(depth)}    /**
${gtd(depth)}     * Constructs a new ${node.name}.
${gtd(depth)}     * @memberof ${trimmedPath}
${gtd(depth)}     * @classdesc Represents a ${node.name}.
${gtd(depth)}     * @implements I${node.name}
${gtd(depth)}     * @constructor
${gtd(depth)}     * @param {${trimmedPath}.I${
      node.name
    }=} [properties] Properties to set
${gtd(depth)}     */
${gtd(depth)}    function ${node.name}(properties) {
${gtd(depth)}        if (properties)
${gtd(
  depth,
)}            for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
${gtd(depth)}                if (properties[keys[i]] != null)
${gtd(depth)}                    this[keys[i]] = properties[keys[i]];
${gtd(depth)}    }
${Object.keys(node.fields).reduce((accum, key) => {
  return `${accum}\n${this.generateField(node.fields[key], node, path, depth)}`;
}, '')}
${
  !options.compileWithBuilders
    ? ''
    : Object.keys(node.fields).reduce((accum, key) => {
        return `${accum}\n${this.generateSetter(
          node.fields[key],
          node,
          path,
          depth,
        )}`;
      }, '')
}
${
  !options.compileWithBuilders
    ? ''
    : `
${gtd(depth)}    /**
${gtd(depth)}     * Converts the ${node.name} to an object
${gtd(depth)}     * @function toObject
${gtd(depth)}     * @memberof ${trimmedPath}.${node.name}
${gtd(depth)}     * @instance
${gtd(depth)}     * @returns {object} object
${gtd(depth)}     */
${gtd(depth)}    ${node.name}.prototype.toObject = function() {
${gtd(depth)}        return JSON.parse(JSON.stringify(this));
${gtd(depth)}    };
`
}
${nestedCodeBlocks.join('\n')}
${gtd(depth)}    return ${node.name};
${gtd(depth)}})();
${gtd(depth)}
${gtd(depth)}${node.name} = ${node.parent.name}.${node.name};`;
  };

  generateEnum = (options, node, path, depth) => {
    const trimmedPath = trimLeadingDot(path);
    return `
${gtd(depth)}/**
${gtd(depth)} * ${node.name} enum.
${gtd(depth)} * @name ${trimmedPath}.${node.name}
${gtd(depth)} * @enum {string}
${Object.keys(node.values).reduce((accum, key, idx) => {
  const line = `${gtd(depth)} * @property {string} ${key}=${key} ${key} value`;
  return `${accum}\n${line}`;
}, '')}
${gtd(depth)} */
${gtd(depth)}${node.parent.name}.${node.name} = (function() {
${gtd(depth)}    var values = {};
${Object.keys(node.values).reduce((accum, key) => {
  const line = `${gtd(depth)}    values["${key}"] = "${key}";`;
  return `${accum}\n${line}`;
}, '')}
${gtd(depth)}    return values;
${gtd(depth)}})();
${gtd(depth)}
${gtd(depth)}${node.name} = ${node.parent.name}.${node.name};`;
  };
}
