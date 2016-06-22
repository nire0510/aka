'use strict';

var app = require('../config/app.json');
var storage = require('node-persist');

// create & initialize storage:
let settings = storage.create({
  dir: 'scrippets'
});
settings.initSync();

// If it's the first time the code runs, add the necessary keys:
if (!settings.keys().some((strKey) => strKey === app.scrippetsDirectoryPathKeyName)) {
  settings.setItemSync(app.scrippetsDirectoryPathKeyName, app.scrippetsDirectoryDefaultPath);
}

module.exports = settings;
