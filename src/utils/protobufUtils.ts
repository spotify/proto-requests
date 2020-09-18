// @ts-ignore
import { Method, Service, Type, Root, Enum } from 'protobufjs';

export function traverseTypes(current, fn) {
    if (current instanceof Type)
        fn(current);
    if (current.nestedArray)
        current.nestedArray.forEach(function(nested) {
            traverseTypes(nested, fn);
        });
}

export function traverseServices(current, fn) {
    if (current instanceof Service)
        fn(current);
    if (current.nestedArray)
        current.nestedArray.forEach(function(nested) {
            traverseServices(nested, fn);
        });
}

export function getFullName(node) {
    let currentNode = node;
    let pathArray = [node.name];
    while (!!currentNode.parent && currentNode.parent.name) {
        currentNode = currentNode.parent;
        pathArray.unshift(currentNode.name);
    }
    return pathArray.join('.');
}

export function getFullServiceName(root: Root): string {
    const serviceNames = [];
    traverseServices(root, function(type) {
        serviceNames.push(type.fullName);
    });
    return serviceNames[0];
}

export function getService(root: Root): Service {
    const serviceNames = [];
    traverseServices(root, function(type) {
        serviceNames.push(type.fullName);
    });
    return root.lookupService(serviceNames[0]);
}

export function getServiceMethods(service: Service): Method[] {
    return service.methodsArray;
}

export function getFullTypeNames(root: Root): string[] {
    const typeNames = [];
    traverseTypes(root, function(type) {
        typeNames.push(type.fullName);
    });
    return typeNames;
}

export function getTypes(root: Root): Type[] {
    const typeNames = [];
    traverseTypes(root, function(type) {
        typeNames.push(type.fullName);
    });
    return typeNames.map(typeName => root.lookupType(typeName));
}
