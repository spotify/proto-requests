import * as fs from 'fs';
const mkdirp = require('mkdirp');
const getDirName = require('path').dirname;

export type WriteFunction = (fileName: string, content: any) => void;

export const writeOutput: WriteFunction = (fileName, content) => {
  mkdirp(getDirName(fileName), function(err) {
    if (err) return console.log('Error creating directory: ', err);

    fs.writeFile(fileName, content, err => {
      if (err) console.error('Failed to generate models: ', err);
      console.log('Generated models successfully for: ', fileName);
    });
  });
};

export const writeOutputSync: WriteFunction = (fileName, content) => {
  try {
    mkdirp.sync(getDirName(fileName));
  } catch (err) {
    console.error('Error creating directory', err);
  }

  try {
    fs.writeFileSync(fileName, content);
    console.log('Generated models successfully for: ', fileName);
  } catch (err) {
    console.error('Failed to generate models: ', err);
  }
};
