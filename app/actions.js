var app = require('../config/app.json');
var aux = require('./aux');
var dict = require('../config/dictionary.json');
var inquirer = require('inquirer');
var pkg = require('../package.json');
var Alias = require('./alias');
var aliases = require('./aliases');
var galiases = require('./galiases');
var settings = require('./settings');
var sargs = require('string-argv');

var actions = {
  /**
   * Customized help screen
   */
  help() {
    var execSync = require('child_process').execSync,
      strLatestVersion;

    // show aliases directory path:
    console.log(dict.program.setup.messages.storagepath,
      settings.getItemSync(app.privateAliasesDirectoryPathKeyName).white.bold);

    // check latest version:
    process.stdout.write(dict.program.commands.version.messages.checking);
    strLatestVersion = execSync('npm show as-known-as version');
    // new version available:
    if (`${strLatestVersion}`.indexOf(pkg.version) !== 0) {
      console.log(dict.program.commands.version.messages.newversion.green,
        `${strLatestVersion}`.replace( /[^0-9\.]/ , '').bold.green);
      console.log(dict.program.commands.version.messages.upgrade,
        dict.program.commands.version.messages.command.bold);
    }
    // up-to-date:
    else {
      console.log(dict.program.commands.version.messages.uptodate.green, pkg.version.white.bold);
    }
  },

  /**
   * Open AKA website (on npm.js
   */
  website() {
    aux.shell('open "https://www.npmjs.com/package/as-known-as"', null, [])
  },

  /**
   * Shows all aliases with optional filter
   */
  list(strFilter, objOptions) {
    let intCounter = 0,
      repo = objOptions.global ? galiases : aliases;

    // no aliases:
    if (repo.length() === 0) {
      console.warn(dict.program.commands.list.messages.listempty.green);
      return;
    }

    // print aliases:
    repo.forEach(function(key, value) {
      // display command if not filter specified or filter matches command alias:
      if (!strFilter || key.indexOf(strFilter) !== -1 ||
        (value.description && value.description.indexOf(strFilter) !== -1)) {
        intCounter++;
        // show alias & command:
        try {
          console.log('*', key.bold.magenta, value.description || '');
          if (!objOptions.command) {
            console.log(' ', value.command.gray);
          }
        }
        catch(err) {
          console.log('*', key.bold.red, 'alias is invalid');
        }
      }
    });

    // no aliases after filter - suggest searching global aliases:
    if (intCounter === 0 && !objOptions.global) {
      inquirer.prompt([{
        type: 'confirm',
        name: 'global',
        message: dict.program.commands.list.messages.showglobal,
        default: 'y'
      }]).then(function (answers) {
        // confirmed:
        if (answers.global) {
          objOptions.global = true;
          actions.list(strFilter, objOptions);
          return;
        }
        else {
          // print total:
          console.log();
          console.log(intCounter === 1 ?
            dict.program.commands.list.messages.totalone :
            dict.program.commands.list.messages.total, intCounter.toString().bold);
        }
      });
    }
    // print total:
    else {
      console.log();
      console.log(intCounter === 1 ?
        dict.program.commands.list.messages.totalone :
        dict.program.commands.list.messages.total, intCounter.toString().bold);
    }
  },

  /**
   * Changes private aliases directory
   * @param {string} strTargetPath Target path
   */
  chdir(strTargetPath) {
    if (aux.moveDirectoryContent(settings.getItemSync(app.privateAliasesDirectoryPathKeyName),
        strTargetPath)) {
      settings.setItemSync(app.privateAliasesDirectoryPathKeyName, strTargetPath);
      console.log(dict.program.commands.chdir.messages.changed.green, strTargetPath.bold.white);
    }
  },

  /**
   * Rename alias and optionally update its description
   * @param {string} strAlias Current alias
   * @param {string} strNewAlias New alias
   * @param {object} objOptions Command options
   */
  move(strAlias, strNewAlias, objOptions) {
    let objAlias = actions.getAlias(strAlias, objOptions, true);

    // alias not found:
    if (!objAlias) {
      return;
    }

    // remove old command:
    if (strNewAlias) {
      actions.remove([strAlias], {}, true);
    }

    // add new command:
    actions.upsert(strNewAlias ? strNewAlias : strAlias,
      objAlias.command, {
        description: objOptions.description && typeof objOptions.description === 'string' ?
          objOptions.description :
          objAlias.description
      }, true);

    // command feedback:
    console.log(dict.program.commands.move.messages.moved.green, strNewAlias ?
      strNewAlias.bold.white :
      strAlias.bold.white
    );
  },

  /**
   * Copies an alias
   * @param {string} strAlias Current alias
   * @param {string} strNewAlias New alias
   * @param {object} objOptions Command options
   */
  copy(strAlias, strNewAlias, objOptions) {
    let objAlias = actions.getAlias(strAlias, objOptions, true);

    // alias not found:
    if (!objAlias) {
      return;
    }

    // add new command:
    actions.upsert(strNewAlias,
      objAlias.command, {
        description: objAlias.description
      }, true);

    // command feedback:
    console.log(dict.program.commands.copy.messages.copied.green, strNewAlias.bold.white);
  },

  /**
   * Adds a new alias or updates an existing one
   * @param {string[]} arrCommand Command as an array of words
   * @param {object} objOptions Command options
   * @param {boolean} blnMuted Indicates whether not to show feedback
   */
  upsert(strAlias, strCommand, objOptions, blnMuted) {
    let objAlias = actions.getAlias(strAlias, objOptions, false),
      objNewAlias = new Alias(strAlias,
        strCommand,
        objOptions.description && typeof objOptions.description === 'string' ? objOptions.description : null);

    // upsert:
    aliases.setItem(strAlias, objNewAlias.asJSON());
    // feedback:
    if (!blnMuted) {
      console.log(!objAlias ?
          dict.program.commands.upsert.messages.added.green :
          dict.program.commands.upsert.messages.updated.green,
        objNewAlias.alias.bold.white);
    }
  },

  /**
   * Returns an alias and optionally displays an error if it doesn't
   * @param {string} strAlias Alias
   * @param {object} objOptions Command options
   * @param {boolean} blnShowError Indicates whether to show and error if alias doesn't exist
   */
  getAlias(strAlias, objOptions, blnShowError) {
    let objAlias = objOptions && objOptions.global ? galiases.getItemSync(strAlias) : aliases.getItemSync(strAlias);

    // feedback:
    if (!objAlias && blnShowError) {
      console.error('There is no action with alias:'.red, strAlias.bold.red);
    }

    return objAlias;
  },

  /**
   * Removes an alias
   * @param {string[]} arrAliases Array of aliases
   * @param {object} objOptions Command options
   * @param {boolean} blnMuted Indicates whether not to show feedback
   */
  remove (arrAliases, objOptions, blnMuted) {
    // remove all aliases flag:
    if (objOptions.recursive) {
      // skip confirmation flag:
      if (objOptions.force) {
        aliases.clearSync();
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
            aliases.clearSync();
            console.log(dict.program.commands.remove.messages.allremoved.green);
          }
        });
      }
    }
    else {
      // alias is required:
      if (arrAliases.length === 0) {
        console.error(dict.program.commands.remove.messages.aliasmissing.red);
        return;
      }

      // remove:
      arrAliases.forEach((strAlias) => {
        // remove alias:
        aliases.removeItemSync(strAlias);
      });

      // feedback:
      if (!blnMuted) {
        arrAliases.length === 1 ?
          console.log(dict.program.commands.remove.messages.removed.green, `${arrAliases[0]}`.bold.white) :
          console.log(dict.program.commands.remove.messages.someremoved.green);
      }
    }
  },

  /**
   * Executes an alias
   * @param {string} strAlias Alias
   * @param {object} objOptions Command options
   */
  execute(strAlias, objOptions) {
    let objAlias = actions.getAlias(strAlias, objOptions, false),
      repo = objOptions.global ? galiases : aliases;

    // alias found:
    if (objAlias) {
      // check if it has bindings:
      if (/[{]{2}.+[}]{2}/.test(objAlias.command)) {
        _parseBinding(objAlias).then(
          (objParsedAlias) => {
            _exec(objParsedAlias, objOptions);
          },
          () => {
            console.error(dict.program.commands.execute.messages.bindingfailed);
          }
        );
      }
      else {
        _exec(objAlias, objOptions);
      }
    }
    // alias not found, display similar aliases
    else {
      let arrAliases = [];

      // print similar aliases:
      repo.forEach(function (key, value) {
        // display command if not filter specified or filter matches command alias:
        if (key.indexOf(strAlias) !== -1 ||
          (value.description && value.description.indexOf(strAlias) !== -1)) {
          arrAliases.push({
            name: `${key.bold}${value.description ? ' ' + value.description.gray : ''}`,
            value: value
          });
        }
      });
      // some aliases found - add quit option:
      if (arrAliases.length > 0) {
        // separator:
        arrAliases.push(new inquirer.Separator());
        if (!objOptions.global) {
          // search galiases:
          arrAliases.push({
            name: dict.program.commands.common.messages.global,
            value: 'global'
          });
        }
        // quit
        arrAliases.push({
          name: dict.program.commands.execute.messages.quit,
          value: 'quit'
        });
      }
      // no alias found, go automatically to galiases:
      else if (!objOptions.global) {
        objOptions.global = true;
        actions.execute(strAlias, objOptions);
        return;
      }

      // similar aliases not found:
      if (arrAliases.length === 0) {
        console.error(dict.program.commands.execute.messages.noalias.red, strAlias.bold.red);
        return;
      }
      // similar aliases found:
      else {
        inquirer.prompt([{
          type: 'list',
          name: 'alias',
          choices: arrAliases,
          message: dict.program.commands.execute.messages.aliaseslike
        }]).then(function (answers) {
          if (answers.alias) {
            // quit:
            if (answers.alias === 'quit') {
              return;
            }

            // search globals:
            if (answers.alias === 'global') {
              objOptions.global = true;
              actions.execute(strAlias, objOptions);
              return;
            }

            // execute:
            if (/[{]{2}.+[}]{2}/.test(answers.alias.command)) {
              _parseBinding(answers.alias).then(
                (objParsedAlias) => {
                  _exec(objParsedAlias, objOptions);
                },
                () => {
                  console.error(dict.program.commands.execute.messages.bindingfailed);
                }
              );
            }
            else {
              _exec(answers.alias, objOptions);
            }
          }
        });
      }
    }

    /**
     * execute command
     * @param {object} objAlias Alias object
     * @param {object} objOptions Command options
     * @private
     */
    function _exec(objAlias, objOptions) {
      const strFullCommand = `${objAlias.command}${objOptions.params ? ' ' + objOptions.params : ''}`;
      const strCommand = strFullCommand.indexOf(' ') > 0 ?
        strFullCommand.substr(0, strFullCommand.indexOf(' ')) :
        strFullCommand;
      const arrOpts = strFullCommand.trim().indexOf(' ') > 0 ?
        sargs(strFullCommand.substr(strFullCommand.indexOf(' ') + 1)) :
        [];

      // display command:
      console.log(strFullCommand.bold.magenta, objAlias.description || '');
      console.log();

      // do not execute function:
      if (objOptions.dry) {
        return;
      }
  
      aux.shell(strFullCommand, strCommand, arrOpts, function () {
        return process.exit();
      });
    }

    /**
     * Replaces binding with user input
     * @param objAlias Alias object
     * @return {string} Alias after binding parsing
     * @private
     */
    function _parseBinding(objAlias) {
      let arrQuestions = [],
        regexp = /{{(.+?)}}/g,
        arrBinding,
        arrBindingParts,
        intCounter = 0,
        objQuestion = {};

      return new Promise((resolve, reject) => {
        arrBinding = regexp.exec(objAlias.command);
        while (arrBinding != null) {
          arrBindingParts = arrBinding[1].split('|');
          switch (arrBindingParts[1]) {
            case 'input':
              objQuestion = {
                name: arrBinding[0],
                message: arrBindingParts[0],
                type: arrBindingParts[1]
              };
              // default option:
              if (arrBindingParts.length === 3) {
                objQuestion.default = arrBindingParts[2];
              }
              break;
            case 'list':
              objQuestion = {
                name: arrBinding[0],
                message: arrBindingParts[0],
                type: arrBindingParts[1],
                choices: arrBindingParts[2].split(';')
              };
              break;
            case 'confirm':
              objQuestion = {
                name: arrBinding[0],
                message: arrBindingParts[0],
                type: arrBindingParts[1]
              };
              break;
          }

          // Add question only if binding doesn't exist in questions array yet (repeated bindings):
          if (arrQuestions.some((objQuestion) => objQuestion.name === arrBinding[0]) === false) {
            arrQuestions.push(objQuestion);
            intCounter++;
          }
          arrBinding = regexp.exec(objAlias.command);
        }

        if (arrQuestions.length > 0) {
          inquirer.prompt(arrQuestions).then(function (answers) {
            for (let key in answers) {
              if (key.indexOf('|confirm|') !== -1) {
                objAlias.command = objAlias.command.replace(key,
                  answers[key] ? key.substring(key.lastIndexOf('|') + 1, key.lastIndexOf('}') - 1) : '');
              }
              else {
                objAlias.command = objAlias.command.replace(key, answers[key]);
              }
            }

            resolve(objAlias);
          });
        }
        else {
          reject();
        }
      });
    }
  }
};

module.exports = actions;
