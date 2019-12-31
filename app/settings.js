const os = require('os');
const childProcess = require('child_process');
const path = require('path');
const storage = require('node-persist');
const app = require('../config/app.json');
const dict = require('../config/dictionary.json');

require('colors');

let settings;

// create & initialize storage:
try {
  settings = storage.create({
    dir: path.join(os.homedir(), app.settingsDirectoryName),
  });
  settings.initSync();

  // Add setting key for private aliases if it doesn't exist:
  if (!settings.keys().some((strKey) => strKey === app.privateAliasesDirectoryPathKeyName)) {
    settings.setItemSync(app.privateAliasesDirectoryPathKeyName,
      path.join(os.homedir(), app.privateAliasesDirectoryName));
  }
  // Add setting key for public aliases if it doesn't exist:
  if (!settings.keys().some((strKey) => strKey === app.publicAliasesDirectoryPathKeyName)) {
    const execSync = childProcess.execSync;
    const strModulePath = `${execSync('npm root -g')}/as-known-as`.replace(/\n/g, '');

    settings.setItemSync(app.publicAliasesDirectoryPathKeyName,
      path.join(strModulePath, app.publicAliasesDirectoryName));
  }
}
catch (e) {
  console.log('SETTINGS:', dict.program.setup.messages.storagefailed.red);
  process.exit(0);
}

module.exports = settings;
