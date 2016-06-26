'use strict';

var app = require('../config/app.json');
var path = require('path');
var storage = require('node-persist');

// create & initialize storage:
let settings = storage.create({
  dir: 'aliases'
});
settings.initSync();

// If it's the first time the code runs, add the necessary keys:
if (!settings.keys().some((strKey) => strKey === app.aliasesDirectoryPathKeyName)) {
  settings.setItemSync(app.aliasesDirectoryPathKeyName, path.join(process.env.HOME, '.aliases'));
}

module.exports = settings;
