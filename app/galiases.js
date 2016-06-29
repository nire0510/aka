'use strict';

var app = require('../config/app.json');
var aux = require('./aux');
var settings = require('./settings');
var storage = require('node-persist');
var galiases;

// make sure the aliases directory exists:
if (!aux.isDirectory(settings.getItemSync(app.publicAliasesDirectoryPathKeyName))) {
  aux.createDirectory(settings.getItemSync(app.publicAliasesDirectoryPathKeyName));
}

try {
  // create & initialize storage:
  galiases = storage.create({
    dir: settings.getItemSync(app.publicAliasesDirectoryPathKeyName)
  });
  galiases.initSync();
} catch (e) {
  console.log(dict.program.setup.messages.storagefailed.red);
  process.exit(0);
}

module.exports = galiases;