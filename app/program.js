'use strict';

var actions = require('./actions');
var colors = require('colors');
var commander = require('commander');
var dict = require('../config/dictionary.json');
var pkg = require('../package.json');

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
    .command('upsert <command...>')
    .alias('set')
    .description(dict.program.commands.upsert.description)
    .option('-n, --name <name>', dict.program.commands.upsert.options.name)
    .option('-d, --description <description>', dict.program.commands.upsert.options.description)
    .action(actions.upsert);

  commander
    .command('move <from> [to]')
    .alias('mv')
    .description(dict.program.commands.move.description)
    .option('-d, --description <description>', dict.program.commands.move.options.description)
    .action(actions.move);

  commander
    .command('list [filter]')
    .alias('ls')
    .description(dict.program.commands.list.description)
    .option('-c, --command', dict.program.commands.list.options.command)
    .action(actions.list);

  commander
    .command('remove [name...]')
    .alias('rm')
    .option('-r, --recursive', dict.program.commands.remove.options.recursive)
    .option('-f, --force', dict.program.commands.remove.options.force)
    .description(dict.program.commands.remove.description)
    .action(actions.remove);

  commander
    .command('execute <name>')
    .alias('x')
    .option('-d, --dry', dict.program.commands.execute.options.dry)
    .option('-p, --params <params...>', dict.program.commands.execute.options.params)
    .description(dict.program.commands.execute.description)
    .action(actions.execute);

  // parse args:
  commander.parse(args);
  // display help if no args passed:
  if (!commander.args.length && !commander.chdir) commander.help();
};

module.exports = commander;