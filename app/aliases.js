const storage = require('node-persist');
const app = require('../config/app.json');
const aux = require('./aux');
const dict = require('../config/dictionary.json');
const settings = require('./settings');

let aliases;

// make sure the aliases directory exists:
try {
  if (!aux.isDirectory(settings.getItemSync(app.privateAliasesDirectoryPathKeyName))) {
    aux.createDirectory(settings.getItemSync(app.privateAliasesDirectoryPathKeyName));
  }
}
catch (e) {
  console.error('ALIASES:', dict.program.setup.messages.directoryfailed.red);
  process.exit(0);
}

try {
  // create & initialize storage:
  aliases = storage.create({
    dir: settings.getItemSync(app.privateAliasesDirectoryPathKeyName),
  });
  aliases.initSync();
}
catch (e) {
  console.error('ALIASES:', dict.program.setup.messages.storagefailed.red);
  process.exit(0);
}

module.exports = aliases;
