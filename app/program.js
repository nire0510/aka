const { Command } = require('commander');
const actions = require('./actions');
const dictionary = require('../config/dictionary.json');
const pkg = require('../package.json');

const program = new Command();

require('colors');

program
  .name('aka')
  .version(pkg.version)
  .description(pkg.description)
  .option('-C, --chdir <path>', dictionary.program.commands.chdir.description)
  .option('-m, --migrate', dictionary.program.commands.migrate.description)
  .option('-w, --website', dictionary.program.commands.website.description)
  .option('-d, --dry', dictionary.program.commands.execute.options.dry)
  .option('-p, --params <params...>', dictionary.program.commands.execute.options.params)
  .action(async (options) => {
    if (options.chdir) {
      actions.chdir(options.chdir);
    }
    else if (options.migrate) {
      actions.migrate();
    }
    else if (options.website) {
      actions.website();
    }
    else {
      if (program.args.length > 0) {
        actions.execute(program.args, options);
      }
      else {
        await actions.help();
        program.help();
      }
    }
  });

program
  .command('copy <from> <to>')
  .alias('cp')
  .description(dictionary.program.commands.copy.description)
  .option('-d, --description <description>', dictionary.program.commands.copy.options.description)
  .action(actions.copy);

program
  .command('execute <alias...>')
  .alias('ex')
  .alias('exec')
  .option('-d, --dry', dictionary.program.commands.execute.options.dry)
  .option('-p, --params <params...>', dictionary.program.commands.execute.options.params)
  .description(dictionary.program.commands.execute.description)
  .action(actions.execute);

program
  .command('list [filter...]')
  .alias('ls')
  .description(dictionary.program.commands.list.description)
  .option('-c, --command', dictionary.program.commands.list.options.command)
  .action(actions.list);

program
  .command('make <alias> <command>')
  .alias('mk')
  .alias('add')
  .description(dictionary.program.commands.upsert.description)
  .option('-d, --description <description>', dictionary.program.commands.upsert.options.description)
  .action((alias, command, options) => actions.upsert(alias, command, options, false));

program
  .command('move <from> [to]')
  .alias('mv')
  .description(dictionary.program.commands.move.description)
  .option('-d, --description <description>', dictionary.program.commands.move.options.description)
  .action(actions.move);

program
  .command('remove <alias...>')
  .alias('rm')
  .description(dictionary.program.commands.remove.description)
  .action(actions.remove);

module.exports = {
  async run(args) {
    program.parse(args);
  }
};
