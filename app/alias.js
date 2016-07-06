'use strict';

class Alias {
  constructor (strAlias, strCommand, strDescription, blnInteractive) {
    this.alias = strAlias;
    this.command = strCommand;
    this.description = strDescription || '';
    this.interactive = blnInteractive || false;
    this.timestamp = new Date();
  }

  asJSON() {
    return {
      alias: this.alias,
      command: this.command,
      description: this.description,
      interactive: this.interactive,
      timestamp: this.timestamp
    }
  }
}

module.exports = Alias;