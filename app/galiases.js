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

// create & initialize storage:
galiases = storage.create({
  dir: settings.getItemSync(app.publicAliasesDirectoryPathKeyName)
});
galiases.initSync();

module.exports = galiases;