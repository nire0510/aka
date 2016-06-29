'use strict';

var app = require('../config/app.json');
var dict = require('../config/dictionary.json');
var aux = require('./aux');
var settings = require('./settings');
var storage = require('node-persist');
var aliases;

// make sure the aliases directory exists:
try {
  if (!aux.isDirectory(settings.getItemSync(app.privateAliasesDirectoryPathKeyName))) {
    aux.createDirectory(settings.getItemSync(app.privateAliasesDirectoryPathKeyName));
  }
} catch (e) {
  console.error('ALIASES:', dict.program.setup.messages.directoryfailed.red);
  process.exit(0);
}

try {
  // create & initialize storage:
  aliases = storage.create({
    dir: settings.getItemSync(app.privateAliasesDirectoryPathKeyName)
  });
  aliases.initSync();
} catch (e) {
  console.error('ALIASES:', dict.program.setup.messages.storagefailed.red);
  process.exit(0);
}

module.exports = aliases;