const storage = require('node-persist');
const dictionary = require('../../config/dictionary.json');

module.exports = class Storage {
  _storage;
  dir;

  constructor(dir) {
    this._storage = storage.create({ dir });
    this.dir = dir;
  }

  async init() {
    try {
      await this._storage.init();
    }
    catch (error) {
      console.error(dictionary.program.setup.messages.storagefailed.red);
    }
  }

  forEach(callback) {
    return this._storage.forEach(callback);
  }

  getItem(key) {
    return this._storage.getItem(key);
  }

  length() {
    return this._storage.length();
  }

  keys() {
    return this._storage.keys();
  }

  removeItem(key) {
    return this._storage.removeItem(key);
  }

  async setItem(key, value) {
    try {
      await this._storage.setItem(key, value);

      return true;
    }
    catch (error) {
      return false;
    }
  }
}
