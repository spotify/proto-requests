const path = require('path');
const { trimEnd } = require('lodash');
const generateDts = require('../generateDts').default;

if (!process.argv[2]) {
  console.error(
    'You must specify a directory for which to generate ts declarations',
  );
  process.exit();
}

let targetDirectory = __dirname;
if (path.isAbsolute(process.argv[2])) {
  targetDirectory = trimEnd(process.argv[2], '/');
} else {
  targetDirectory = path.join(
    __dirname,
    '../../',
    trimEnd(process.argv[2], '/'),
  );
}

console.log('Generating typescript declarations for: ', targetDirectory);

if (process.argv[3] === 'true') {
  generateDts(targetDirectory, true);
} else {
  generateDts(targetDirectory);
}
