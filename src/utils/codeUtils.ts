// @ts-ignore
import { Enum, Field, Method, Namespace, Root, Service, Type } from 'protobufjs';
import { memoize, trimStart, flatten } from 'lodash';
import {snakeToCamel} from "./caseUtils";

const getTabsForDepthInner = (depth) => {
    let result = '';
    for (let i = 0; i < depth; i++) {
        result += '    ';
    }
    return result;
};

export const trimLeadingDot = (input) => trimStart(input, '.');

export const getTabsForDepth = memoize(getTabsForDepthInner);

export const getEntityNameFromNamespace = (entity, separator = '.') => {
    const split = entity.split(separator);
    return snakeToCamel(split[split.length-1]);
};

export const gtd = getTabsForDepth;

export const getNestedNodes = (node) => {
    let nestedNodes = [];
    if (node.nested) {
        const keys = Object.keys(node.nested).sort();
        nestedNodes = keys.map(key => node.nested[key]);
    }
    return nestedNodes;
};

export const getAllNestedChildNodes = (nodes) => {
    const nestedChildrenDeep = nodes.map(node => getNestedNodes(node));
    const nestedChildren = flatten(nestedChildrenDeep);
    if (!nestedChildren.length) {
        return [];
    }
    return [...nestedChildren, ...getAllNestedChildNodes(nestedChildren)]
};

export const generateRoot = (options, node, path, depth, nodeHandlers) => {
    const nestedNodes = getNestedNodes(node);
    const namespaces = nestedNodes.filter(node => node instanceof Namespace);
    return namespaces.reduce((output, namespace) => {
        output += generateAnnotatedNamespaces(options, namespace, path, depth, nodeHandlers);
        return output;
    }, '');
};

export const generateNamespace = (options, node, path, depth, nodeHandlers) => {
    const nestedNodes = getNestedNodes(node);
    if (node instanceof Field || node instanceof Service || node instanceof Method) {
        console.log('Something went wrong, we found an unexpected nested node');
        throw new Error('Something went wrong, we found an unexpected nested node');
    }
    path = path.replace('$root', '');
    const memberOf = trimStart(path, '.');
    const parentNamespace = getEntityNameFromNamespace(path) || '$root';
    let memberOfOrExports = '';
    if (parentNamespace === '$root') {
        memberOfOrExports = `${gtd(depth)}     * @exports ${node.name}`;
    } else {
        memberOfOrExports = `${gtd(depth)}     * @memberof ${memberOf || node.name}`;
    }
    return `
${gtd(depth)}${parentNamespace}.${node.name} = (function() {
${gtd(depth)}    /**
${gtd(depth)}     * Namespace ${node.name}.
${memberOfOrExports}
${gtd(depth)}     * @namespace
${gtd(depth)}     */
${gtd(depth)}    var ${node.name} = {};
${nestedNodes.map(nestedNode => generateAnnotatedNamespaces(options, nestedNode, `${path}.${node.name}`, depth + 1, nodeHandlers)).join('')}
${gtd(depth)}    return ${node.name};
${gtd(depth)}})();
`;
};

export const generateAnnotatedNamespaces = (options, node, path, depth, nodeHandlers) => {
    if (node instanceof Service) {
        return nodeHandlers.service ? nodeHandlers.service(options, node, path, depth, nodeHandlers) : '';
    }
    if (node instanceof Enum) {
        return nodeHandlers.enum ? nodeHandlers.enum(options, node, path, depth, nodeHandlers) : '';
    }
    if (node instanceof Type) {
        return nodeHandlers.type ? nodeHandlers.type(options, node, path, depth, nodeHandlers) : '';
    }
    if (node instanceof Field) {
        return nodeHandlers.field ? nodeHandlers.field(options, node, path, depth, nodeHandlers) : '';
    }
    if (node instanceof Method) {
        return nodeHandlers.method ? nodeHandlers.method(options, node, path, depth, nodeHandlers) : '';
    }
    if (node instanceof Root) {
        return nodeHandlers.root
            ? nodeHandlers.root(options, node, path, depth, nodeHandlers) || ''
            : generateRoot(options, node, path, depth, nodeHandlers);
    }
    if (node instanceof Namespace) {
        return nodeHandlers.namespace
            ? nodeHandlers.namespace(options, node, path, depth, nodeHandlers) || ''
            : generateNamespace(options, node, path, depth, nodeHandlers);
    }
    return '';
};
