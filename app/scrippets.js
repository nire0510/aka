'use strict';

var app = require('../config/app.json');
var aux = require('./aux');
var settings = require('./settings');
var storage = require('node-persist');

// make sure the scrippets directory exists:
if (!aux.isDirectory(settings.getItemSync(app.scrippetsDirectoryPathKeyName))) {
  aux.createDirectory(settings.getItemSync(app.scrippetsDirectoryPathKeyName));
}

// create & initialize storage:
let scrippets = storage.create({
  dir: aux.expandTilde(settings.getItemSync(app.scrippetsDirectoryPathKeyName))
});
scrippets.initSync();

module.exports = scrippets;