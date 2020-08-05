export const setupModule = (options) => {
    if (options.libraryTarget === 'commonjs' || options.libraryTarget === 'commonjs2') {
        return '';
    } else if (options.libraryTarget === 'module') {
        return '';
    } else if (options.libraryTarget === 'esModule') {
        return 'Object.defineProperty(exports, \'__esModule\', { value: true });';
    } else {
        throw new Error(`File format ${options.libraryTarget} is not currently supported!`);
    }
};

export const declareObjects = (options, namesList) => {
    return namesList.map(name => declareObject(options, name)).join('\n');
};

export const declareObject = (options, name) => {
    if (options.libraryTarget === 'commonjs' || options.libraryTarget === 'commonjs2' || options.libraryTarget === 'module' || options.libraryTarget === 'esModule') {
        return `var ${name} = {};`;
    } else {
        throw new Error(`File format ${options.libraryTarget} is not currently supported!`);
    }
};

export const declareExports = (options, exportNamesList) => {
    return exportNamesList.map(name => declareExport(options, name)).join('\n');
};

export const declareExport = (options, exportName) => {
    if (options.libraryTarget === 'commonjs' || options.libraryTarget === 'commonjs2') {
        return `module.exports = ${exportName};`;
    } else if (options.libraryTarget === 'module') {
        return `export const ${exportName} = ${exportName};`;
    } else if (options.libraryTarget === 'esModule') {
        return `exports["${exportName}"] = ${exportName};`;
    } else {
        throw new Error(`File format ${options.libraryTarget} is not currently supported!`);
    }
};

export const exportDefault = (options, exportName) => {
    if (options.libraryTarget === 'commonjs' || options.libraryTarget === 'commonjs2') {
        return `module.exports = ${exportName};`;
    } else if (options.libraryTarget === 'module') {
        return `export default ${exportName};`;
    } else if (options.libraryTarget === 'esModule') {
        return `exports["default"] = ${exportName};`;
    } else {
        throw new Error(`File format ${options.libraryTarget} is not currently supported!`);
    }
};
