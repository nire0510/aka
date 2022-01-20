const colors = require('colors');
const getv = require('getv');
const execSync = require('child_process').execSync;
const inquirer = require('inquirer');
const { parseArgsStringToArgv } = require('string-argv');
const Alias = require('./models/alias.js');
const AliasesStorage = require('./stores/aliases.js');
const app = require('../config/app.json');
const dictionary = require('../config/dictionary.json');
const fs = require('./utils/fs');
const pkg = require('../package.json');
const SettingsStorage = require('./stores/settings.js');
const shell = require('./utils/shell');

const actions = {
  /**
   * Customized help screen
   * @returns {undefined}
   */
  async help() {
    const latestVersion = execSync('npm show as-known-as version');
    const settingsStorage = await SettingsStorage.getInstance();
    const aliasesDirectoryPath = await settingsStorage.getItem(app.aliasesDirectoryPathKeyName);

    // show aliases directory path:
    console.log(dictionary.program.setup.messages.storagepath, colors.white.bold(aliasesDirectoryPath));
    // check latest version:
    console.log(dictionary.program.commands.version.messages.checking);
    if (`${latestVersion}`.indexOf(pkg.version) !== 0) {
      console.log(colors.green(dictionary.program.commands.version.messages.newversion),
        colors.bold.green(`${latestVersion}`.replace( /[^0-9.]/ , '')));
      console.log(dictionary.program.commands.version.messages.upgrade,
        colors.bold(dictionary.program.commands.version.messages.command));
    }
    else {
      console.log(colors.green(dictionary.program.commands.version.messages.uptodate), colors.white.bold(pkg.version));
    }
    console.log();
  },

  /**
   * Open AKA website (on npm.js
   * @returns {undefined}
   */
  website() {
    shell.execute('open "https://www.npmjs.com/package/as-known-as"',
      'open',
      ['https://www.npmjs.com/package/as-known-as']);
    process.exit();
  },

  /**
   * Shows all aliases with optional filter
   * @param {string} filter Commands filter
   * @param {object} options Command options
   * @returns {undefined}
   */
  async list(filter, options) {
    const aliasesStorage = await AliasesStorage.getInstance();

    // no aliases:
    if (aliasesStorage.length() === 0) {
      console.log(colors.green(dictionary.program.commands.list.messages.listempty));
    }
    else {
      let counter = 0;
      const aliases = [];
      const filterRegExp = new RegExp(`${filter || '.'}`, 'i');

      // print aliases:
      await aliasesStorage.forEach((datum) => {
        // display command if not filter specified or filter matches command alias:
        if (filterRegExp.test(datum.key) || filterRegExp.test((datum.value.description || ''))) {
          counter++;
          aliases.push({
            key: datum.key,
            description: datum.value.description,
            command: datum.value.command,
          });
        }
      });

      aliases
        .sort((a, b) => a.key.toLowerCase() > b.key.toLowerCase() ? 1 : -1)
        .forEach((alias) => {
          console.log('*', colors.bold.magenta(alias.key), alias.description);
          if (options.command) {
            console.log(' ', colors.gray(alias.command));
          }
        });

      console.log();
      console.log(counter === 1 ?
        dictionary.program.commands.list.messages.totalone :
        dictionary.program.commands.list.messages.total, colors.bold(counter.toString()));
    }
  },

  /**
   * Changes private aliases directory
   * @param {string} targetDir Target directry path
   * @returns {undefined}
   */
  async chdir(targetDir) {
    const settingsStorage = await SettingsStorage.getInstance();
    const currentDir = await settingsStorage.getItem(app.aliasesDirectoryPathKeyName);

    if (fs.moveDirectoryContent(currentDir, targetDir)) {
      await settingsStorage.setItem(app.aliasesDirectoryPathKeyName, targetDir);
      console.log(colors.green(dictionary.program.commands.chdir.messages.changed), colors.bold.white(targetDir));
    }
  },

  /**
   * Rename alias and optionally update its description
   * @param {string} alias Current alias
   * @param {string} newAlias New alias
   * @param {object} options Command options
   * @returns {undefined}
   */
  async migrate() {
    try {
      const aliasesStorage = await AliasesStorage.getInstance();
      const settingsStorage = await SettingsStorage.getInstance();
      const aliasesDirectoryPath = await settingsStorage.getItem(app.aliasesDirectoryPathKeyName);

      if (aliasesDirectoryPath) {
        const files = await fs.readDirectory(aliasesDirectoryPath);

        files.forEach(async (file) => {
          try {
            const content = await fs.readFile(`${aliasesDirectoryPath}/${file}`);
            const json = JSON.parse(content);

            if (json.alias) { // old format
              const { alias, ...value } = json;

              await aliasesStorage.setItem(alias, value);
              await fs.deleteFile(`${aliasesDirectoryPath}/${file}`);
            }
          }
          catch (error) {
            fs.deleteFile(`${aliasesDirectoryPath}/${file}`);
          }
        });

        console.log(colors.green(dictionary.program.commands.migrate.messages.done));
      }
    }
    catch (error) {
      console.log(colors.red(dictionary.program.commands.migrate.messages.error));
    }
  },

  /**
   * Rename alias and optionally update its description
   * @param {string} curAlias Current alias
   * @param {string} newAlias New alias
   * @param {object} options Command options
   * @returns {undefined}
   */
  async move(curAlias, newAlias, options) {
    const aliasObject = await actions.getAlias(curAlias, false);

    if (aliasObject) {
      // remove old command:
      if (newAlias) {
        await actions.remove([curAlias], true);
      }

      await actions.upsert(newAlias || curAlias,
        aliasObject.command,
        { description: options.description || aliasObject.description },
        true,
      );
      console.log(colors.green(dictionary.program.commands.move.messages.moved),
        colors.bold.white(newAlias || curAlias));
    }
  },

  /**
   * Copies an alias
   * @param {string} curAlias Current alias
   * @param {string} newAlias New alias
   * @param {object} options Command options
   * @returns {undefined}
   */
  async copy(curAlias, newAlias, options) {
    const aliasObject = await actions.getAlias(curAlias, false);

    if (aliasObject) {
      await actions.upsert(newAlias,
        aliasObject.command,
        { description: options.description || aliasObject.description },
        true,
      );
      console.log(colors.green(dictionary.program.commands.copy.messages.copied), colors.bold.white(newAlias));
    }
  },

  /**
   * Adds a new alias or updates an existing one
   * @param {string} alias Alias
   * @param {string} command Command
   * @param {object} options Options
   * @param {boolean} [muted] Indicates whether not to show feedback
   * @returns {undefined}
   */
  async upsert(alias, command, options, muted=false) {
    const curAliasObject = await actions.getAlias(alias);
    const newAliasObject = new Alias(alias, command, options.description || getv(curAliasObject, 'description'));
    const aliasesStorage = await AliasesStorage.getInstance();

    await aliasesStorage.setItem(alias, newAliasObject.valueOf());
    if (!muted) {
      console.log(
        colors.green(!curAliasObject ?
          dictionary.program.commands.upsert.messages.added :
          dictionary.program.commands.upsert.messages.updated),
        colors.bold.white(newAliasObject.alias));
    }
  },

  /**
   * Returns an alias and optionally displays an error if it doesn't
   * @param {string} alias Alias
   * @param {boolean} [muted] Indicates whether to show and error if alias doesn't exist
   * @returns {Promise<Alias>} Alias object
   */
  async getAlias(alias, muted=true) {
    const aliasesStorage = await AliasesStorage.getInstance();
    const aliasObject = await aliasesStorage.getItem(alias);

    // feedback:
    if (!aliasObject && !muted) {
      console.log(colors.red(dictionary.program.commands.common.messages.noSuchAlias), colors.bold.red(alias));
    }

    return aliasObject;
  },

  /**
   * Removes an alias
   * @param {string[]} aliases Array of aliases
   * @param {boolean} muted Indicates whether not to show feedback
   * @returns {Promise<void>} Undefined
   */
  async remove(aliases, muted=false) {
    if (aliases.length === 0) {
      console.log(colors.red(dictionary.program.commands.remove.messages.aliasmissing));
    }
    else {
      const aliasesStorage = await AliasesStorage.getInstance();
      const removedAliases = await Promise.all(aliases.map((alias) => aliasesStorage.removeItem(alias)));

      // feedback:
      if (!(muted === true)) {
        removedAliases.length === 1 ?
          console.log(colors.green(dictionary.program.commands.remove.messages.removed),
            colors.bold.white(`${aliases[0]}`)) :
          console.log(colors.green(dictionary.program.commands.remove.messages.someremoved));
      }
    }
  },

  /**
   * Executes an alias
   * @param {string} alias Alias
   * @param {object} options Command options
   * @returns {Promise<void>} Undefined
   */
  async execute(alias, options) {
    const aliasObject = await actions.getAlias(alias);
    const aliasesStorage = await AliasesStorage.getInstance();

    // alias found:
    if (aliasObject) {
      // check if it has bindings:
      if (/[{]{2}.+[}]{2}/i.test(aliasObject.command)) {
        _parseBinding(aliasObject)
          .then((parsedAlias) => {
            _exec(parsedAlias, options);
          },
          () => {
            console.log(dictionary.program.commands.execute.messages.bindingfailed);
          });
      }
      else {
        _exec(aliasObject, options);
      }
    }
    // alias not found, display similar aliases
    else {
      const aliases = [];

      // print similar aliases:
      await aliasesStorage.forEach((datum) => {
        const aliasRegExp = new RegExp(`${alias}`, 'i');

        // display command if not filter specified or filter matches command alias:
        if (aliasRegExp.test(datum.key) || aliasRegExp.test((datum.value.description || ''))) {
          aliases.push({
            name: `${datum.key.bold}${datum.value.description ? ' ' + colors.gray(datum.value.description) : ''}`,
            value: datum.key,
          });
        }
      });

      // similar aliases not found:
      if (aliases.length > 1) {
        inquirer.prompt([{
          type: 'list',
          name: 'alias',
          choices: aliases.sort((a, b) => a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)
            .concat(new inquirer.Separator(), {
              name: dictionary.program.commands.execute.messages.quit,
              value: 'Quit',
            }),
          message: dictionary.program.commands.execute.messages.aliaseslike,
        }]).then(function (answers) {
          if (answers.alias) {
            // quit:
            if (answers.alias === 'Quit') {
              return;
            }

            actions.execute(answers.alias, options);
          }
        });
      }
      else {
        console.log(colors.red(dictionary.program.commands.execute.messages.noalias), colors.bold.red(alias));
      }
    }

    /**
     * execute command
     * @param {object} aliasObject Alias object
     * @param {object} options Command options
     * @private
     * @returns {undefined}
     */
    function _exec(aliasObject, options) {
      const fullCommand = `${aliasObject.command}${options.params ? ' ' + options.params : ''}`;
      const command = fullCommand.indexOf(' ') > 0 ?
        fullCommand.substring(0, fullCommand.indexOf(' ')) :
        fullCommand;

      options = fullCommand.trim().indexOf(' ') > 0 ?
        parseArgsStringToArgv(fullCommand.substring(fullCommand.indexOf(' ') + 1)) :
        [];

      // display command:
      console.log(colors.bold.magenta(fullCommand), aliasObject.description || '');
      console.log();

      // do not execute function:
      if (options.dry) {
        return;
      }

      shell.execute(fullCommand, command, options, function () {
        return process.exit();
      });
    }

    /**
     * Replaces binding with user input
     * @param {Alias} aliasObject Alias object
     * @return {string} Alias after binding parsing
     * @private
     */
    function _parseBinding(aliasObject) {
      return new Promise((resolve, reject) => {
        const regexp = /{{(.+?)}}/g;
        let bindings = regexp.exec(aliasObject.command);
        const questions = [];

        while (bindings != null) {
          const bindingParts = bindings[1].split('|');
          let question = {};

          switch (bindingParts[1]) {
          case 'input':
            question = {
              name: bindings[0],
              message: bindingParts[0],
              type: bindingParts[1]
            };
            // default option:
            if (bindingParts.length === 3) {
              question.default = bindingParts[2];
            }
            break;
          case 'list':
            question = {
              name: bindings[0],
              message: bindingParts[0],
              type: bindingParts[1],
              choices: bindingParts[2].split(';')
            };
            break;
          case 'confirm':
            question = {
              name: bindings[0],
              message: bindingParts[0],
              type: bindingParts[1]
            };
            break;
          }

          // Add question only if binding doesn't exist in questions array yet (repeated bindings):
          if (questions.some((question) => question.name === bindings[0]) === false) {
            questions.push(question);
          }
          bindings = regexp.exec(aliasObject.command);
        }

        if (questions.length > 0) {
          inquirer
            .prompt(questions)
            .then((answers) => {
              for (const key in answers) {
                if (key.indexOf('|confirm|') !== -1) {
                  aliasObject.command = aliasObject.command.replace(key,
                    answers[key] ? key.substring(key.lastIndexOf('|') + 1, key.lastIndexOf('}') - 1) : '');
                }
                else {
                  aliasObject.command = aliasObject.command.replace(key, answers[key]);
                }
              }

              resolve(aliasObject);
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
