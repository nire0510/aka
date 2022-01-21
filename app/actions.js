const colors = require('colors');
const execSync = require('child_process').execSync;
const getv = require('getv');
const inquirer = require('inquirer');
const { parseArgsStringToArgv } = require('string-argv');
const Alias = require('./models/alias');
const AliasesStorage = require('./stores/aliases');
const app = require('../config/app.json');
const dictionary = require('../config/dictionary.json');
const fs = require('./utils/fs');
const pkg = require('../package.json');
const SettingsStorage = require('./stores/settings');
const shell = require('./utils/shell');

/**
 * Returns an alias and optionally displays an error if it doesn't
 * @param {string} alias Alias
 * @param {boolean} [muted] Indicates whether to show and error if alias doesn't exist
 * @returns {Promise<Alias>} Alias object
 */
async function getAlias(alias, muted=true) {
  const aliasesStorage = await AliasesStorage.getInstance();
  const aliasObject = await aliasesStorage.getItem(alias);

  // feedback:
  if (!aliasObject && !muted) {
    console.log(colors.red(dictionary.program.commands.common.messages.noSuchAlias), colors.bold.red(alias));
  }

  return aliasObject;
}

async function searchAliases(filter) {
  const aliasesStorage = await AliasesStorage.getInstance();
  const aliases = [];

  // print aliases:
  await aliasesStorage.forEach((datum) => {
    aliases.push({
      key: datum.key,
      description: datum.value.description,
      command: datum.value.command,
    });
  });

  return filter
    .reduce((a, token) => a
      .filter((alias) => !token ||
        alias.key.toLowerCase().indexOf(token.toLowerCase()) !== -1 ||
        (alias.description || '').toLowerCase().indexOf(token.toLowerCase()) !== -1), aliases)
    .sort((a, b) => a.key.toLowerCase() > b.key.toLowerCase() ? 1 : -1);
}

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
        colors.green.bold(`${latestVersion}`.replace( /[^0-9.]/ , '')));
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
    const url = 'https://www.npmjs.com/package/as-known-as';

    shell.execute(`open "${url}"`, 'open', [url]);
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
      const results = await searchAliases(filter);

      results
        .forEach((alias) => {
          console.log('*', colors.bold.magenta(alias.key), alias.description);
          if (options.command) {
            console.log(' ', colors.gray(alias.command));
          }
        });

      console.log();
      console.log(dictionary.program.commands.list.messages[results.length === 1 ? 'totalone' : 'total'],
        colors.bold(results.length.toString()));
    }
  },

  /**
   * Changes private aliases directory
   * @param {string} targetAliasesDirPath Target directry path
   * @returns {undefined}
   */
  async chdir(targetAliasesDirPath) {
    const settingsStorage = await SettingsStorage.getInstance();
    const currentAliasesDirectoryPath = await settingsStorage.getItem(app.aliasesDirectoryPathKeyName);

    if (fs.moveDirectoryContent(currentAliasesDirectoryPath, targetAliasesDirPath)) {
      await settingsStorage.setItem(app.aliasesDirectoryPathKeyName, targetAliasesDirPath);
      console.log(colors.green(dictionary.program.commands.chdir.messages.changed),
        colors.bold.white(targetAliasesDirPath));
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
    const aliasObject = await getAlias(curAlias, false);

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
    const aliasObject = await getAlias(curAlias, false);

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
    const curAliasObject = await getAlias(alias);
    const newAliasObject = new Alias(alias, command, options.description || getv(curAliasObject, 'description'));
    const aliasesStorage = await AliasesStorage.getInstance();

    await aliasesStorage.setItem(alias, newAliasObject.valueOf());
    if (!muted) {
      console.log(
        colors.green(dictionary.program.commands.upsert.messages[!curAliasObject ? 'added' : 'updated']),
        colors.bold.white(newAliasObject.alias));
    }
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
   * @param {string[]} alias Alias as string (commander)
   * @param {object} options Command options
   * @returns {Promise<void>} Undefined
   */
  async execute(alias, options) {
    const aliasObject = await getAlias(alias.join(' '));

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
      const results = await searchAliases(alias);

      // single alias found
      if (results.length === 1) {
        actions.execute([results[0].key], options);
      }
      // similar aliases not found:
      else if (results.length > 1) {
        inquirer
          .prompt([{
            type: 'list',
            name: 'alias',
            choices: results
              .map((a) => ({
                name: `${colors.bold(a.key)}${a.description ? ' ' + colors.gray(a.description) : ''}`,
                value: a.key,
              }))
              .concat(new inquirer.Separator(), {
                name: dictionary.program.commands.execute.messages.quit,
                value: 'Quit',
              }),
            message: dictionary.program.commands.execute.messages.aliaseslike,
          }])
          .then((answers) => {
            if (answers.alias) {
              if (answers.alias === 'Quit') {
                return;
              }

              actions.execute([answers.alias], options);
            }
          });
      }
      else {
        console.log(colors.red(dictionary.program.commands.execute.messages.noalias), colors.bold.red(alias.join(' ')));
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

      shell.execute(fullCommand, command, options, () => {
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
          case 'password':
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
