const path = require('path');
const fs = require('fs');
const polyfillFileHeader = require('../../utils/fileHeader').polyfillFileHeader;

const polyfills = {
  Timestamp: {
    filename: 'Timestamp.d.ts',
    fullName: 'google.protobuf.Timestamp',
  },
};

Object.keys(polyfills).forEach(key => {
  const filePath = path.join(__dirname, './', polyfills[key].filename);
  const fileAsText = fs.readFileSync(filePath).toString();
  polyfills[key].contents = `${fileAsText}`;
});

export default polyfills;
