'use strict';

var app = require('../config/app.json');
var aux = require('./aux');
var dict = require('../config/dictionary.json');
var inquirer = require('inquirer');
var pkg = require('../package.json');
var Scrippet = require('./scrippet');
var scrippets = require('./scrippets');
var settings = require('./settings');
var sargs = require('string-argv');

var actions = {
  version() {
    var execSync = require('child_process').execSync,
      strLatestVersion;

    process.stdout.write(dict.program.commands.version.messages.checking);
    strLatestVersion = execSync('npm show scrippets version');
    if (`${strLatestVersion}`.indexOf(pkg.version) !== 0) {
      console.log(dict.program.commands.version.messages.newversion.green,
        `${strLatestVersion}`.replace( /[^0-9\.]/ , '').bold.green);
      console.log(dict.program.commands.version.messages.upgrade,
        dict.program.commands.version.messages.command.bold);
    }
    else {
      console.log(dict.program.commands.version.messages.uptodate.green);
    }
  },

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
      // display command if not filter specified or filter matches command alias:
      if (!strFilter || key.indexOf(strFilter) !== -1 ||
        (value.description && value.description.indexOf(strFilter) !== -1)) {
        intCounter++;
        // show scrippet alias & command:
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
   * @param {string} strScrippetAlias Current scrippet alias
   * @param {string} strScrippetNewAlias New scrippet alias
   * @param {object} objOptions Command options
   */
  move(strScrippetAlias, strScrippetNewAlias, objOptions) {
    let objScrippet = actions.getScrippet(strScrippetAlias, true);

    // scrippet not found:
    if (!objScrippet) {
      return;
    }

    // remove old command:
    if (strScrippetNewAlias) {
      actions.remove([strScrippetAlias], {}, true);
    }

    // add new command:
    actions.upsert(objScrippet.command.split(' '), {
      alias: strScrippetNewAlias ? strScrippetNewAlias : strScrippetAlias,
      description: objOptions.description && typeof objOptions.description === 'string' ?
        objOptions.description :
        objScrippet.description
    }, true);

    // feedback:
    console.log(dict.program.commands.move.messages.moved.green, strScrippetNewAlias ?
      strScrippetNewAlias.bold.white :
      strScrippetAlias.bold.white
    );
  },

  /**
   * Adds a new scrippet or updates an existing one
   * @param {string[]} arrCommand Command as an array of words
   * @param {object} objOptions Command options
   * @param {boolean} blnMute Indicates whether not to show feedback
   */
  upsert(arrCommand, objOptions, blnMute) {
    let strScrippetAlias = (objOptions.alias && typeof objOptions.alias === 'string') ?
      objOptions.alias : aux.generateAlias(scrippets.keys()),
      objScrippet = actions.getScrippet(strScrippetAlias),
      strCommand = typeof arrCommand === 'string' ? arrCommand : arrCommand.join(' '),
      objCommand = new Scrippet(strScrippetAlias,
        strCommand,
        objOptions.description && typeof objOptions.description === 'string' ? objOptions.description : null);

    // upsert:
    scrippets.setItem(strScrippetAlias, objCommand.asJSON());
    // feedback:
    if (!blnMute) {
      console.log(!objScrippet ?
          dict.program.commands.upsert.messages.added.green :
          dict.program.commands.upsert.messages.updated.green,
        objCommand.alias.bold.white);
    }
  },

  /**
   * Returns a scrippet by its alias and optionally displays an error if it doesn't
   * @param {string} strScrippetAlias Scrippet alias
   * @param {boolean} blnShowError Indicates whether to show and error if scrippet doesn't exist
   */
  getScrippet(strScrippetAlias, blnShowError) {
    let scrippet = scrippets.getItemSync(strScrippetAlias);

    // feedback:
    if (!scrippet && blnShowError) {
      console.error('There is no action with alias:'.red, strScrippetAlias.bold.red);
    }

    return scrippet;
  },

  /**
   * Removes a scrippet
   * @param {string[]} arrScrippetAliases Scrippet alias(es)
   * @param {object} objOptions Command options
   */
  remove (arrScrippetAliases, objOptions, blnMuted) {
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
      // alias is required:
      if (arrScrippetAliases.length === 0) {
        console.error(dict.program.commands.remove.messages.aliasmissing.red);
        return;
      }

      // remove:
      arrScrippetAliases.forEach((strScrippetAlias) => {
        // remove scrippet:
        scrippets.removeItemSync(strScrippetAlias);
      });

      // feedback:
      if (!blnMuted) {
        arrScrippetAliases.length === 1 ?
          console.log(dict.program.commands.remove.messages.removed.green, `${arrScrippetAliases[0]}`.bold.white) :
          console.log(dict.program.commands.remove.messages.someremoved.green);
      }
    }
  },

  /**
   * Executes a scrippet
   * @param {string} strScrippetAlias Scrippet alias
   * @param {object} objOptions Command options
   */
  execute(strScrippetAlias, objOptions) {
    let objScrippet = actions.getScrippet(strScrippetAlias);

    // scrippet found:
    if (objScrippet) {
      if (objOptions.binding) {
        _parseBinding(objScrippet).then(
          (objParsedScrippet) => {
            _exec(objParsedScrippet, objOptions);
          },
          () => {
            console.error(dict.program.commands.execute.messages.bindingfailed);
          }
        );
      }
      else {
        _exec(objScrippet, objOptions);
      }
    }
    // scrippet not found, display similar scrippets
    else {
      let arrScrippets = [];

      // print similar scrippets:
      scrippets.forEach(function(key, value) {
        // display command if not filter specified or filter matches command alias:
        if (key.indexOf(strScrippetAlias) !== -1 ||
          (value.description && value.description.indexOf(strScrippetAlias) !== -1)) {
          arrScrippets.push({
            name: `${key.bold}${value.description ? ' ' + value.description.gray : ''}`,
            value: value
          });
        }
      });
      // add quit option:
      if (arrScrippets.length > 0) {
        arrScrippets.push({
          name: dict.program.commands.execute.messages.quit,
          value: 'quit'
        });
      }

      // similar scrippets not found:
      if (arrScrippets.length === 0) {
        console.error(dict.program.commands.execute.messages.noscrippet.red, strScrippetAlias.bold.red);
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
          if (answers.scrippet && answers.scrippet !== 'quit') {
            // execute:
            if (objOptions.binding) {
              _parseBinding(answers.scrippet).then(
                (objParsedScrippet) => {
                  _exec(objParsedScrippet, objOptions);
                },
                () => {
                  console.error(dict.program.commands.execute.messages.bindingfailed);
                }
              );
            }
            else {
              _exec(answers.scrippet, objOptions);
            }
          }
        });
      }
    }

    /**
     * Replaces binding with user input
     * @param objScrippet Scrippet object
     * @return {string} Scrippet after binding parsing
     * @private
     */
    function _parseBinding (objScrippet) {
      let arrQuestions = [],
        regexp = /{{(.+?)}}/g,
        arrBinding,
        arrBindingParts,
        intCounter = 0;

      return new Promise((resolve, reject) => {
        arrBinding = regexp.exec(objScrippet.command);
        while (arrBinding != null) {
          arrBindingParts = arrBinding[1].split('|');
          arrQuestions.push(arrBindingParts[1] === 'input' ?
            {
              name: arrBinding[0],
              message: arrBindingParts[0],
              type: arrBindingParts[1]
            } :
            {
              name: arrBinding[0],
              message: arrBindingParts[0],
              type: arrBindingParts[1],
              choices: arrBindingParts[2].split(';')
            }
          );
          intCounter++;
          arrBinding = regexp.exec(objScrippet.command);
        }

        if (arrQuestions.length > 0) {
          inquirer.prompt(arrQuestions).then(function (answers) {
            for (let key in answers) {
              objScrippet.command = objScrippet.command.replace(key, answers[key]);
            }

            resolve(objScrippet);
          });
        }
        else {
          reject();
        }
      });
    }

    /**
     * execute command
     * @param {object} objScrippet Scrippet object
     * @param {object} objOptions Command options
     * @private
     */
    function _exec(objScrippet, objOptions) {
      const strFullCommand = `${objScrippet.command}${objOptions.params ? ' ' + objOptions.params : ''}`;
      const strCommand = strFullCommand.indexOf(' ') > 0 ?
        strFullCommand.substr(0, strFullCommand.indexOf(' ')) :
        strFullCommand;
      const arrOpts = strFullCommand.trim().indexOf(' ') > 0 ?
        sargs(strFullCommand.substr(strFullCommand.indexOf(' ') + 1)) :
        [];

      // display command:
      console.log(strFullCommand);
      console.log();

      // do not execute function:
      if (objOptions.dry) {
        return;
      }

      // parse command:
      actions.shell(strCommand, arrOpts, function () {
        return process.exit();
      });
    }
  },

  /**
   * Creates a shell
   * @param {string} strCommand Command
   * @param {object[]} arrOpts Command pptions
   * @param {function} fncCallback Callback function
   * @returns {*}
   * @private
   */
  shell(strCommand, arrOpts, fncCallback) {
    const spawn = require('child_process').spawn;
    var proc;

    process.stdin.pause();
    process.stdin.setRawMode(false);

    proc = spawn(strCommand, arrOpts, {
      stdio: [0, 1, 2]
    });

    return proc.on('exit', function() {
      process.stdin.setRawMode(true);
      process.stdin.resume();

      return fncCallback();
    });
  }
};

module.exports = actions;