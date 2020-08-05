const fs = require('fs');
const get = require('lodash/get');
const endsWith = require('lodash/endsWith');
const trimEnd = require('lodash/trimEnd');
const isObject = require('lodash/isObject');
const { exec, execSync } = require('child_process');

/**
 * Builds declaration file name for a given js file
 * @param jsFileName
 */
const buildDtsFilenameForFile = jsFileName => {
  const split = jsFileName.split('/');
  const fileName = split[split.length - 1];
  const fileNameWithoutExt = fileName.split('.')[0];
  const splitsWithoutFileName = split.slice(0, split.length - 1);
  const dtsName = `${splitsWithoutFileName.join(
    '/',
  )}/${fileNameWithoutExt}.d.ts`;
  return dtsName;
};

/**
 * Builds namespaced export for file based on its path
 * @param jsFileName
 * @param targetDirectory
 */
const buildExportFromFilename = (jsFileName, targetDirectory) => {
  const relativeFileName = jsFileName.replace(`${targetDirectory}/`, '');
  const withoutExt = relativeFileName.split('.')[0];
  return withoutExt.split('/').join('.');
};

/**
 * BUilds a single ts declaration file for a js file
 * @param jsFileName
 */
const buildSingleDtsFile = jsFileName => {
  const outputFile = buildDtsFilenameForFile(jsFileName);

  try {
    execSync(`pbts -o ${outputFile} ${jsFileName}`);
    console.log('Succesfully generated declarations file: ', outputFile);
    return outputFile;
  } catch (err) {
    console.error('Error generating the declarations file: ', err);
  }
};

export const getNamespacedExportPath = (node, nodeName, targetName, path) => {
  let possiblePaths = [];
  let keys = Object.keys(node);
  if (keys.length === 0 || nodeName === targetName) {
    return [trimEnd(path, '.')];
  } else {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (isObject(node[key])) {
        const childPaths = getNamespacedExportPath(
          node[key],
          key,
          targetName,
          path + key + '.',
        );
        possiblePaths = possiblePaths.concat(childPaths);
      }
    }
  }
  const correctPath = possiblePaths.filter(path => endsWith(path, targetName));
  return correctPath[0];
};

/**
 * Builds a single declaration file with included aliased export
 * @param jsFileName
 * @param targetDirectory
 */
export const buildSingleDtsFileWithAliasedExport = (
  jsFileName,
  targetDirectory,
) => {
  const outputFile = buildSingleDtsFile(jsFileName);

  const fileDefaultExport = require(jsFileName).default;

  const splitFileName = jsFileName.split('/');
  const jsTargetName = splitFileName[splitFileName.length - 1].split('.')[0];
  const exportWithNamespacePath = getNamespacedExportPath(
    fileDefaultExport,
    'default',
    jsTargetName,
    '',
  );

  if (outputFile) {
    const defaultExport = buildExportFromFilename(jsFileName, targetDirectory);
    const namedExport = defaultExport.split('.').pop();
    const declarationExtension = `export const ${namedExport} = ${exportWithNamespacePath};`;

    try {
      fs.appendFileSync(outputFile, declarationExtension);
      return outputFile;
    } catch (err) {
      console.error(
        `Error appending named export to .d.ts file for ${jsFileName}`,
        err,
      );
    }
  } else {
    console.log(`No output file to append export for ${jsFileName}`);
  }
};

/**
 * Generates a TS declaration file for each provided file. Appends
 * an additional aliased export for each file's
 * primary class for easier client import.
 *
 * @param jsFileNames List of file names to build declaration files for
 * @param targetDirectory Location of js files
 * @param skipAliasedExports Flag to determine if files should include alias exports
 */
const buildDtsFiles = (
  jsFileNames: string[],
  targetDirectory: string,
  skipAliasedExports: boolean,
) => {
  let errorCount = 0;

  jsFileNames.forEach(jsFileName => {
    let outputFile;

    if (skipAliasedExports) {
      outputFile = buildSingleDtsFile(jsFileName);
    } else {
      outputFile = buildSingleDtsFileWithAliasedExport(
        jsFileName,
        targetDirectory,
      );
    }

    if (!outputFile) errorCount += 1;
  });

  console.log(
    `Declaration file generation completed with ${errorCount} errors`,
  );
};

/**
 * Locates directory and parses all available JS files. Parses
 * JS file names to build output declaration file names and
 * default export names for each file. Continues on to
 * execute protobufjs' pbts command to generate a declaration
 * file for each class.
 *
 * @param targetDirectory Location of generated JS classes
 * @param skipAliasedExports Skip aliased export of builder for clients
 */
export default function generateDts(
  targetDirectory: string,
  skipAliasedExports: boolean,
) {
  const lsPromise = new Promise((resolve, reject) => {
    exec(`find ${targetDirectory} -type f -name '*.js'`, (err, stdout) => {
      if (err) {
        console.error('failed to call ls: ', err);
        reject(err);
        return;
      }

      const jsFileNames = stdout.split('\n').filter(f => !!f);
      resolve(jsFileNames);
    });
  });

  lsPromise.then((jsFileNames: string[]) => {
    buildDtsFiles(jsFileNames, targetDirectory, skipAliasedExports);
  });
}
