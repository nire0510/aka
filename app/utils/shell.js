const childProcess = require('child_process');

/**
 * Creates a shell
 * @param {string} fullCommand Command
 * @param {string} command Command
 * @param {object[]} options Command options
 * @param {function} callback Callback function
 * @returns {undefined}
 * @private
 */
function execute(fullCommand, command, options, callback) {
  const exec = childProcess.exec;

  process.stdin.pause();
  process.stdin.setRawMode(false);

  // command doesn't contain pipe(s):
  if (options.indexOf('|') === -1) {
    const spawn = childProcess.spawn;

    process.stdin.pause();
    process.stdin.setRawMode(false);

    const proc = spawn(command, options, {
      stdio: [process.stdin, process.stdout, 'pipe'],
      cwd: process.env.PWD,
      shell: true,
      env: process.env,
    });

    return proc.on('exit', () => {
      process.stdin.setRawMode(true);
      process.stdin.resume();

      return typeof callback === 'function' ? callback() : true;
    });
  }

  exec(fullCommand, {
    cwd: process.env.PWD,
    env: process.env,
  }, (err, stdout, stderr) => {
    if (err) {
      console.error(stderr);
      throw err;
    }

    console.log(stdout);
  });

  return undefined;
}

module.exports = {
  execute,
};
