'use strict';

var app = require('../config/app.json');
var aux = require('./aux');
var settings = require('./settings');
var storage = require('node-persist');

// make sure the aliases directory exists:
if (!aux.isDirectory(settings.getItemSync(app.aliasesDirectoryPathKeyName))) {
  aux.createDirectory(settings.getItemSync(app.aliasesDirectoryPathKeyName));
}

// create & initialize storage:
let aliases = storage.create({
  dir: settings.getItemSync(app.aliasesDirectoryPathKeyName)
});
aliases.initSync();

module.exports = aliases;