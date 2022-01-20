const os = require('os');
const app = require('../../config/app.json');
const Storage = require('./storage');

let settingsStorage;

module.exports = {
  async getInstance() {
    if (!settingsStorage) {
      settingsStorage = new Storage(`${os.homedir()}/${app.settingsDirectoryName}`);
      await settingsStorage.init();
    }

    const keys = await settingsStorage.keys();

    // Add setting key for private aliases if it doesn't exist:
    if (keys.findIndex((key) => key === app.aliasesDirectoryPathKeyName) === -1) {
      await settingsStorage.setItem(app.aliasesDirectoryPathKeyName, `${os.homedir()}/${app.aliasesDirectoryName}`);
    }

    return settingsStorage;
  }
};
