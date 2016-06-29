'use strict';

var app = require('../config/app.json');
var dict = require('../config/dictionary.json');
var aux = require('./aux');
var settings = require('./settings');
var storage = require('node-persist');
var aliases;

// make sure the aliases directory exists:
if (!aux.isDirectory(settings.getItemSync(app.privateAliasesDirectoryPathKeyName))) {
  aux.createDirectory(settings.getItemSync(app.privateAliasesDirectoryPathKeyName));
}

// create & initialize storage:
aliases = storage.create({
  dir: settings.getItemSync(app.privateAliasesDirectoryPathKeyName)
});
aliases.initSync();

module.exports = aliases;