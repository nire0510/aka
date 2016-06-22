'use strict';

var pkg = require('../package.json');
var dict = require('../config/dictionary.json');
var colors = require('colors');
var commander = require('commander');
var actions = require('./actions.js');

/**
 * Initializes program
 */
commander.run = function (args) {
  commander
    .version(pkg.version)
    .description(pkg.description)
    .option('-C, --chdir <path>', dict.program.commands.chdir.description)
    .on('chdir', actions.chdir);

  commander
    .command('upsert "<command...>"')
    .alias('set')
    .description(dict.program.commands.upsert.description)
    .option('-i, --identity <identity>', dict.program.commands.upsert.options.identity)
    .option('-d, --description "<description>"', dict.program.commands.upsert.options.description)
    .action(actions.upsert);

  commander
    .command('list [filter]')
    .alias('ls')
    .description(dict.program.commands.list.description)
    .option('-c, --command', dict.program.commands.list.options.command)
    .action(actions.list);

  commander
    .command('remove [id...]')
    .alias('rm')
    .option('-r, --recursive', dict.program.commands.remove.options.recursive)
    .option('-f, --force', dict.program.commands.remove.options.force)
    .description(dict.program.commands.remove.description)
    .action(actions.remove);

  commander
    .command('execute <id>')
    .alias('ex')
    .description(dict.program.commands.execute.description)
    .action(actions.execute);

  // parse args:
  commander.parse(args);
  // display help if no args passed:
  if (!commander.args.length && !commander.chdir) commander.help();
};

module.exports = commander;