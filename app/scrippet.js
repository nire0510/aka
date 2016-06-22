'use strict';

class Scrippet {
  constructor (strName, strCommand, strDescription) {
    this.name = strName;
    this.command = strCommand;
    this.description = strDescription;
    this.timestamp = new Date();
  }

  asJSON() {
    return {
      name: this.name,
      command: this.command,
      description: this.description,
      timestamp: this.timestamp
    }
  }
}

module.exports = Scrippet;