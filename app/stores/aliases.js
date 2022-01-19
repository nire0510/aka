const app = require('../../config/app.json');
const SettingsStorage = require('./settings');
const Storage = require('./storage');

let aliasesStorage;

module.exports = {
  async getInstance() {
    if (!aliasesStorage) {
      const settingsStorage = await SettingsStorage.getInstance();
      const aliasesStorageDir = await settingsStorage.getItem(app.aliasesDirectoryPathKeyName);

      aliasesStorage = new Storage(aliasesStorageDir);
      await aliasesStorage.init();
    }

    return aliasesStorage;
  }
};
