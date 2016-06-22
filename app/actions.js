/**
 * Created by nirelbaz on 22/06/2016.
 */
'use strict';

var app = require('../config/app.json');
var aux = require('./aux');
var dict = require('../config/dictionary.json');
var inquirer = require('inquirer');
var scrippets = require('./scrippets');
var Scrippet = require('./scrippet');
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
      // display command if not filter specified or filter matches command id:
      if (!strFilter || key.indexOf(strFilter) !== -1 ||
        (value.description && value.description.indexOf(strFilter) !== -1)) {
        intCounter++;
        // show scrippet id & command:
        console.log('*', key.bold.magenta, value.description || '');
        if (!objOptions.command) {
          console.log(' ', value.command.gray);
        }
      }
    });

    // print total:
    console.log();
    console.log(dict.program.commands.list.messages.total, intCounter);
  },

  /**
   * Changes scrippets directory
   * @param {string} strTargetPath Target path
   */
  chdir(strTargetPath) {
    if (aux.moveDirectoryContent(settings.getItemSync(app.scrippetsDirectoryPathKeyName),
        strTargetPath)) {
      settings.setItemSync(app.scrippetsDirectoryPathKeyName, strTargetPath);
      console.log(dict.program.commands.chdir.messages.changed.green, intCounter);
    }
  },

  /**
   * Adds a new scrippet or updates an existing one
   * @param {string[]} arrCommand Command as an array of words
   * @param {object} objOptions Command options
   */
  upsert(arrCommand, objOptions) {
    let strScrippetId = objOptions.identity || aux.generateId(scrippets.keys()),
      objScrippet = actions.getScrippet(strScrippetId),
      strCommand = typeof arrCommand === 'string' ? arrCommand : arrCommand.join(' '),
      objCommand = new Scrippet(strScrippetId,
        strCommand,
        objOptions.description && objOptions.description|| null);

    // upsert:
    scrippets.setItem(strScrippetId, objCommand.asJSON());
    // feedback:
    console.log(!objScrippet ?
        dict.program.commands.upsert.messages.added.green :
        dict.program.commands.upsert.messages.updated.green,
      objCommand.id.bold.white);
  },

  /**
   * Returns a scrippet by its ID and optionally displays an error if it doesn't
   * @param {string} strScrippetID Scrippet ID
   * @param {boolean} blnShowError Indicates whether to show and error if scrippet doesn't exist
   */
  getScrippet(strScrippetID, blnShowError) {
    let scrippet = scrippets.getItemSync(strScrippetID);

    // feedback:
    if (!scrippet && blnShowError) {
      console.error('There is no action with id:'.red, strScrippetID.bold.red);
    }

    return scrippet;
  },

  /**
   * Removes a scrippet
   * @param {string[]} arrScrippetID Scrippet ID(s)
   * @param {object} objOptions Command options
   */
  remove (arrScrippetID, objOptions) {
    // remove all scrippets flag:
    if (objOptions.recursive) {
      // skip confirmation flag:
      if (objOptions.force) {
        scrippets.clearSync();
        console.log(dict.program.commands.remove.messages.allremoved.green);
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
      // id is required:
      if (arrScrippetID.length === 0) {
        console.error(dict.program.commands.remove.messages.idmissing.red);
        return;
      }

      // remove:
      arrScrippetID.forEach((strScrippetID) => {
        // remove scrippet:
        scrippets.removeItemSync(strScrippetID);
      });

      // feedback:
      arrScrippetID.length === 1 ?
        console.error(dict.program.commands.remove.messages.removed.green, `${arrScrippetID[0]}`.bold) :
        console.error(dict.program.commands.remove.messages.someremoved.green);
    }
  },

  /**
   * Executes a scrippet
   * @param {string} strScrippetID Scrippet ID
   */
  execute(strScrippetID) {
    let scrippet = actions.getScrippet(strScrippetID);

    // scrippet found:
    if (scrippet) {
      _exec(scrippet);
    }
    // scrippet not found, display similar scrippets
    else {
      let arrScrippets = [];

      // print similar scrippets:
      scrippets.forEach(function(key, value) {
        // display command if not filter specified or filter matches command id:
        if (key.indexOf(strScrippetID) !== -1) {
          arrScrippets.push({
            name: key,
            value: value
          });
        }
      });

      // similar scrippets not found:
      if (arrScrippets.length === 0) {
        console.error(dict.program.commands.execute.messages.noscrippet.red, strScrippetID.bold);
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
            _exec(answers.scrippet);
          }
        });
      }
    }

    function _exec(objScrippet) {
      let exec = require('child_process').exec;

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