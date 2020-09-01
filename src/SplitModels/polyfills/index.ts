const path = require('path');
const fs = require('fs');
const polyfillFileHeader = require('../../utils/fileHeader').polyfillFileHeader;

const polyfills = {
  Timestamp: {
    filename: 'Timestamp.js',
    fullName: 'google.protobuf.Timestamp',
  },
};

Object.keys(polyfills).forEach(key => {
  const filePath = path.join(__dirname, './', polyfills[key].filename);
  const fileAsText = fs.readFileSync(filePath).toString();
  polyfills[key].contents = `${polyfillFileHeader}
${fileAsText}`;
});

export default polyfills;
