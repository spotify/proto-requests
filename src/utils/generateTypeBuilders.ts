// @ts-ignore
import { Enum, Field, Method, Namespace, Root, Service, Type, } from 'protobufjs';
import { upperFirst } from 'lodash';
import {
  getTabsForDepth as gtd,
  getEntityNameFromNamespace,
} from './codeUtils';
import { protoPrimitiveTypesToTsTypes } from './types';

const filterFields = {
  '[[StableObjectId]]': '[[StableObjectId]]',
  constructor: 'constructor',
  toJSON: 'toJSON',
  __proto__: '__proto__',
  length: 'length',
};

const getFieldTsType = (type, client, fieldName) => {
  const field = type.fields[fieldName];
  const isPrimitiveType = !!protoPrimitiveTypesToTsTypes[field.type];
  let assignedType;
  if (isPrimitiveType) {
    assignedType = protoPrimitiveTypesToTsTypes[field.type];
  } else {
    const clientType = client.getTypeOrEnum(field.type);
    assignedType = client.getFullName(clientType);
  }
  return assignedType;
};

const generateAnnotatedFieldSettersJs = (
  type,
  client,
  fieldNames,
  namespace,
) => {
  return fieldNames
    .map(name => generateAnnotatedFieldSetterJs(type, client, name, namespace))
    .join('');
};

const generateAnnotatedFieldSetterJs = (type, client, fieldName, namespace) => {
  const trimmedFieldName = getEntityNameFromNamespace(fieldName);
  const valueType = getFieldTsType(type, client, fieldName);
  return `
        /**
         * Sets ${trimmedFieldName}
         * @function set${upperFirst(trimmedFieldName)}
         * @memberof ${namespace}.${type.name}Builder
         * @param {${valueType}} value
         * @instance
         * @returns {${type.name}Builder} ${type.name}Builder
         */
        ${type.name}Builder.prototype.set${upperFirst(
    trimmedFieldName,
  )} = function(value) {
            this._built['${trimmedFieldName}'] = value;
            return this;
        };
`;
};

export const generateAnnotatedTypeBuildersJs_Namespaced = (
  types,
  client,
  options,
) => {
  const allBuilders = generateAnnotatedTypeBuildersJs_Namespaced_Inner(
    types,
    client,
    options,
    client.root,
    'builders',
    0,
  );
  return `
$root.builders = (function() {
    /**
     * Namespace builders.
     * @exports builders
     * @namespace
     */
    var builders = {};
    
${allBuilders}

    return builders;

})();
`;
};

export const generateAnnotatedTypeBuildersJs_Namespaced_Inner = (
  types,
  client,
  options,
  node,
  path,
  depth,
) => {
  if (
    node instanceof Field ||
    node instanceof Enum ||
    node instanceof Service ||
    node instanceof Method
  ) {
    return '';
  }
  if (node instanceof Type || node instanceof Enum) {
    return generateAnnotatedTypeBuilderJs(node, client, options, path);
  }
  const keys = Object.keys(node.nested);
  const nestedNodes = keys.map(key => node.nested[key]);
  if (node instanceof Root) {
    const namespaces = nestedNodes.filter(node => node instanceof Namespace);
    return namespaces.reduce((output, namespace) => {
      output += generateAnnotatedTypeBuildersJs_Namespaced_Inner(
        types,
        client,
        options,
        namespace,
        path,
        depth,
      );
      return output;
    }, '');
  }
  if (node instanceof Namespace) {
    const parentNamespace = getEntityNameFromNamespace(path);
    return `
${gtd(depth)}${parentNamespace}.${node.name} = (function() {
${gtd(depth)}    /**
${gtd(depth)}     * Namespace ${path}.${node.name}
${gtd(depth)}     * @memberof ${path}
${gtd(depth)}     * @namespace
${gtd(depth)}     */
${gtd(depth)}    var ${node.name} = {};
${gtd(depth)}
${nestedNodes
  .map(nestedNode =>
    generateAnnotatedTypeBuildersJs_Namespaced_Inner(
      types,
      client,
      options,
      nestedNode,
      `${path}.${node.name}`,
      depth + 1,
    ),
  )
  .join('')}
${gtd(depth)}
${gtd(depth)}    return ${node.name};
${gtd(depth)}
${gtd(depth)}})();
`;
  }
  return '';
};

const generateProperties = (fullType, client, fieldNames) => {
  return fieldNames
    .map(fieldName => {
      const trimmedFieldName = getEntityNameFromNamespace(fieldName);
      return `         * @property {${getFieldTsType(
        fullType,
        client,
        fieldName,
      )}|null} [set${upperFirst(trimmedFieldName)}] ${
        fullType.name
      }Builder set${upperFirst(trimmedFieldName)}`;
    })
    .join('\n');
};

const generateAnnotatedTypeBuilderJs = (
  fullType,
  client,
  options,
  namespace,
) => {
  const fullTypeName = client.getFullName(fullType);
  const fieldNames = Object.keys(fullType.fields);
  const filteredFieldNames = fieldNames.filter(
    fieldName => !filterFields[fieldName],
  );
  const properties = generateProperties(fullType, client, fieldNames);
  const builderFn = `
        /**
         * Properties of a ${fullType.name}Builder.
         * @memberof ${namespace}
         * @interface I${fullType.name}Builder
${properties}
         */
        
        /**
         * A builder class to help construct a new ${fullType.name}.
         * @memberof ${namespace}
         * @classdesc ${fullType.name}Builder to construct a ${fullType.name}.
         * @constructor
         * @implements I${fullType.name}Builder
         */
        function ${fullType.name}Builder() {
            this._built = {};
        }
`;
  return `
    ${getEntityNameFromNamespace(namespace)}.${
    fullType.name
  }Builder = (function() {
    
${builderFn}

${generateAnnotatedFieldSettersJs(
  fullType,
  client,
  filteredFieldNames,
  namespace,
)}

        /**
         * Builds the ${fullType.name} object
         * @function build
         * @memberof ${namespace}.${fullType.name}Builder
         * @instance
         * @returns {${fullTypeName}} ${fullTypeName} ${fullTypeName}
         */
        ${fullType.name}Builder.prototype.build = function() {
            return this._built;
        };
        
        return ${fullType.name}Builder;
        
    })();
`;
};
