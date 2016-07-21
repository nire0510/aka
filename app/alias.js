'use strict';

class Alias {
  constructor (strAlias, strCommand, strDescription) {
    this.alias = strAlias;
    this.command = strCommand;
    this.description = strDescription || '';
    this.timestamp = new Date();
  }

  asJSON() {
    return {
      alias: this.alias,
      command: this.command,
      description: this.description,
      timestamp: this.timestamp
    }
  }
}

module.exports = Alias;