class Alias {
  constructor(alias, command, description) {
    this.alias = alias;
    this.command = command;
    this.description = description || '';
    this.timestamp = new Date();
  }

  valueOf() {
    return {
      command: this.command,
      description: this.description,
      timestamp: this.timestamp,
    };
  }
}

module.exports = Alias;
