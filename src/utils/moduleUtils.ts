import { Config } from '../Config';

export const setupModule = (options: Config) => {
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

export const includeCustomImports = (options: Config) => {
    if (options.libraryTarget === 'commonjs' || options.libraryTarget === 'commonjs2') {
        return options.customImports.map(customImport => {
            if (customImport.importDefault) {
                return `const ${customImport.defaultName} = require('${customImport.path}');`;
            } else {
                return `const { ${customImport.namedImports.join(', ')} } = require('${customImport.path}');`;
            }
        }).join('\n');
    } else if (options.libraryTarget === 'module' || options.libraryTarget === 'esModule') {
        return options.customImports.map(customImport => {
            if (customImport.importDefault) {
                return `import ${customImport.defaultName} from '${customImport.path}';`;
            } else {
                return `import { ${customImport.namedImports.join(', ')} } from '${customImport.path}';`;
            }
        }).join('\n');
    } else {
        throw new Error(`File format ${options.libraryTarget} is not currently supported!`);
    }
};

export const declareObjects = (options: Config, namesList: string[]) => {
    return namesList.map(name => declareObject(options, name)).join('\n');
};

export const declareObject = (options: Config, name: string) => {
    if (options.libraryTarget === 'commonjs' || options.libraryTarget === 'commonjs2' || options.libraryTarget === 'module' || options.libraryTarget === 'esModule') {
        return `var ${name} = {};`;
    } else {
        throw new Error(`File format ${options.libraryTarget} is not currently supported!`);
    }
};

export const declareExports = (options: Config, exportNamesList: string[]) => {
    return exportNamesList.map(name => declareExport(options, name)).join('\n');
};

export const declareExport = (options: Config, exportName: string) => {
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

export const exportDefault = (options: Config, exportName: string) => {
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
