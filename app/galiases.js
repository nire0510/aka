'use strict';

var app = require('../config/app.json');
var dict = require('../config/dictionary.json');
var aux = require('./aux');
var settings = require('./settings');
var storage = require('node-persist');
var galiases;

// make sure the aliases directory exists:
try {
  if (!aux.isDirectory(settings.getItemSync(app.publicAliasesDirectoryPathKeyName))) {
    aux.createDirectory(settings.getItemSync(app.publicAliasesDirectoryPathKeyName));
  }
} catch (e) {
  console.error('GALIASES:', dict.program.setup.messages.directoryfailed.red);
  process.exit(0);
}

try {
  // create & initialize storage:
  galiases = storage.create({
    dir: settings.getItemSync(app.publicAliasesDirectoryPathKeyName)
  });
  galiases.initSync();
} catch (e) {
  console.log('GALIASES:', dict.program.setup.messages.storagefailed.red);
  process.exit(0);
}

module.exports = galiases;