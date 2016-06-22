'use strict';

class Scrippet {
  constructor (strId, strCommand, strDescription) {
    this.id = strId;
    this.command = strCommand;
    this.description = strDescription;
    this.timestamp = new Date();
  }

  asJSON() {
    return {
      id: this.id,
      command: this.command,
      description: this.description,
      timestamp: this.timestamp
    }
  }
}

module.exports = Scrippet;