'use strict';

var app = require('../config/app.json');
var aux = require('./aux');
var dict = require('../config/dictionary.json');
var inquirer = require('inquirer');
var Scrippet = require('./scrippet');
var scrippets = require('./scrippets');
var settings = require('./settings');

var actions = {
  /**
   * Shows all scrippets with optional filter
   */
  list(strFilter, objOptions) {
    let intCounter = 0;

    // no scrippets:
    if (scrippets.length() === 0) {
      console.warn(dict.program.commands.list.messages.listempty.green);
      return;
    }

    // print scrippets:
    scrippets.forEach(function(key, value) {
      // display command if not filter specified or filter matches command name:
      if (!strFilter || key.indexOf(strFilter) !== -1 ||
        (value.description && value.description.indexOf(strFilter) !== -1)) {
        intCounter++;
        // show scrippet name & command:
        console.log('*', key.bold.magenta, value.description || '');
        if (!objOptions.command) {
          console.log(' ', value.command.gray);
        }
      }
    });

    // print total:
    console.log();
    console.log(dict.program.commands.list.messages.total, intCounter.toString().bold);
  },

  /**
   * Changes scrippets directory
   * @param {string} strTargetPath Target path
   */
  chdir(strTargetPath) {
    if (aux.moveDirectoryContent(settings.getItemSync(app.scrippetsDirectoryPathKeyName),
        strTargetPath)) {
      settings.setItemSync(app.scrippetsDirectoryPathKeyName, strTargetPath);
      console.log(dict.program.commands.chdir.messages.changed.green, strTargetPath.bold.white);
    }
  },

  /**
   * Rename scrippet and optionally update its description
   * @param {string} strScrippetName Current scrippet name
   * @param {string} strScrippetNewName New scrippet name
   * @param {object} objOptions Command options
   */
  move(strScrippetName, strScrippetNewName, objOptions) {
    let objScrippet = actions.getScrippet(strScrippetName, true);

    // scrippet not found:
    if (!objScrippet) {
      return;
    }

    // remove old command:
    if (strScrippetNewName) {
      actions.remove([strScrippetName], {}, true);
    }

    // add new command:
    actions.upsert(objScrippet.command.split(' '), {
      name: strScrippetNewName ? strScrippetNewName : strScrippetName,
      description: objOptions.description && typeof objOptions.description === 'string' ?
        objOptions.description :
        objScrippet.description
    }, true);

    // feedback:
    console.log(dict.program.commands.move.messages.moved.green, strScrippetNewName ?
      strScrippetNewName.bold.white :
      strScrippetName.bold.white
    );
  },

  /**
   * Adds a new scrippet or updates an existing one
   * @param {string[]} arrCommand Command as an array of words
   * @param {object} objOptions Command options
   * @param {boolean} blnMute Indicates whether not to show feedback
   */
  upsert(arrCommand, objOptions, blnMute) {
    let strScrippetName = (objOptions.name && typeof objOptions.name === 'string') ?
      objOptions.name : aux.generateName(scrippets.keys()),
      objScrippet = actions.getScrippet(strScrippetName),
      strCommand = typeof arrCommand === 'string' ? arrCommand : arrCommand.join(' '),
      objCommand = new Scrippet(strScrippetName,
        strCommand,
        objOptions.description && typeof objOptions.description === 'string' ? objOptions.description : null);

    // upsert:
    scrippets.setItem(strScrippetName, objCommand.asJSON());
    // feedback:
    if (!blnMute) {
      console.log(!objScrippet ?
          dict.program.commands.upsert.messages.added.green :
          dict.program.commands.upsert.messages.updated.green,
        objCommand.name.bold.white);
    }
  },

  /**
   * Returns a scrippet by its name and optionally displays an error if it doesn't
   * @param {string} strScrippetName Scrippet name
   * @param {boolean} blnShowError Indicates whether to show and error if scrippet doesn't exist
   */
  getScrippet(strScrippetName, blnShowError) {
    let scrippet = scrippets.getItemSync(strScrippetName);

    // feedback:
    if (!scrippet && blnShowError) {
      console.error('There is no action with name:'.red, strScrippetName.bold.red);
    }

    return scrippet;
  },

  /**
   * Removes a scrippet
   * @param {string[]} arrScrippetNames Scrippet name(s)
   * @param {object} objOptions Command options
   */
  remove (arrScrippetNames, objOptions, blnMuted) {
    // remove all scrippets flag:
    if (objOptions.recursive) {
      // skip confirmation flag:
      if (objOptions.force) {
        scrippets.clearSync();
        if (!blnMuted) {
          console.log(dict.program.commands.remove.messages.allremoved.green);
        }
      }
      else {
        inquirer.prompt([{
          type: 'confirm',
          name: 'remove',
          message: dict.program.commands.remove.messages.removeconfirm,
          default: 'n'
        }]).then(function (answers) {
          // confirmed:
          if (answers.remove) {
            scrippets.clearSync();
            console.log(dict.program.commands.remove.messages.allremoved.green);
          }
        });
      }
    }
    else {
      // name is required:
      if (arrScrippetNames.length === 0) {
        console.error(dict.program.commands.remove.messages.namemissing.red);
        return;
      }

      // remove:
      arrScrippetNames.forEach((strScrippetName) => {
        // remove scrippet:
        scrippets.removeItemSync(strScrippetName);
      });

      // feedback:
      if (!blnMuted) {
        arrScrippetNames.length === 1 ?
          console.log(dict.program.commands.remove.messages.removed.green, `${arrScrippetNames[0]}`.bold.white) :
          console.log(dict.program.commands.remove.messages.someremoved.green);
      }
    }
  },

  /**
   * Executes a scrippet
   * @param {string} strScrippetName Scrippet name
   * @param {object} objOptions Command options
   */
  execute(strScrippetName, objOptions) {
    let scrippet = actions.getScrippet(strScrippetName);

    // scrippet found:
    if (scrippet) {
      _exec(scrippet, objOptions);
    }
    // scrippet not found, display similar scrippets
    else {
      let arrScrippets = [];

      // print similar scrippets:
      scrippets.forEach(function(key, value) {
        // display command if not filter specified or filter matches command name:
        if (key.indexOf(strScrippetName) !== -1) {
          arrScrippets.push({
            name: key,
            value: value
          });
        }
      });

      // similar scrippets not found:
      if (arrScrippets.length === 0) {
        console.error(dict.program.commands.execute.messages.noscrippet.red, strScrippetName.bold.red);
        return;
      }
      // similar scrippets found:
      else {
        inquirer.prompt([{
          type: 'list',
          name: 'scrippet',
          choices: arrScrippets,
          message: dict.program.commands.execute.messages.scrippetslike
        }]).then(function (answers) {
          // confirmed:
          if (answers.scrippet) {
            // execute:
            _exec(answers.scrippet, objOptions);
          }
        });
      }
    }

    function _exec(objScrippet, objOptions) {
      let exec = require('child_process').exec;

      console.log(objScrippet.command);
      console.log();

      if (objOptions.dry) {
        return;
      }

      exec(objScrippet.command, function(error, stdout, stderr){
        if (error) {
          console.error(stderr);
        }
        else {
          console.log(stdout);
        }
      });
    }
  }
};

module.exports = actions;