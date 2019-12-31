const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

class AUX {
  /**
   * Generates a new alias (max + 1)
   * @param {string[]} arrKeys Array of existing aliases aliases
   * @returns {string} New alias
   */
  static generateAlias(arrKeys) {
    const intMaxId = Math.max.apply(null, arrKeys.filter((strKey) => /^\d+$/.test(strKey))
      .map((strNumber) => parseInt(strNumber, 10)));

    return (intMaxId !== -Infinity && (intMaxId + 1).toString()) || '1';
  }

  /**
   * Checks if path is a directory or if it doesn't exist yet
   * @param {string} strPathName Path
   * @returns {boolean} True if path is directory, false otherwise
   */
  static isDirectory(strPathName) {
    let objStats;

    try {
      objStats = fs.statSync(strPathName);

      return objStats.isDirectory();
    }
    catch (err) {
      return false;
    }
  }

  /**
   * Creates a new directory
   * @param {string} strPathName Path
   * @returns {boolean} True on success, false otherwise
   */
  static createDirectory(strPathName) {
    fs.mkdirSync(strPathName);

    return true;
  }

  /**
   * Move all aliases from one folder to another
   * @param {string} strSourcePath Source directory path
   * @param {string} strTargetPath Destination directory path
   * @returns {boolean} True if action succeeded, false otherwise.
   */
  static moveDirectoryContent(strSourcePath, strTargetPath) {
    // create target directory if not exists:
    if (!this.isDirectory(strTargetPath)) {
      this.createDirectory(strTargetPath);
    }

    // No migration, just setup:
    fs.readdirSync(strSourcePath).forEach((strFileName) => {
      fs.renameSync(path.join(strSourcePath, strFileName), path.join(strTargetPath, strFileName));
    });

    return true;
  }

  /**
   * Creates a shell
   * @param {string} strFullCommand Command
   * @param {string} strCommand Command
   * @param {object[]} arrOpts Command options
   * @param {function} fncCallback Callback function
   * @returns {undefined}
   * @private
   */
  static shell(strFullCommand, strCommand, arrOpts, fncCallback) {
    let proc;

    process.stdin.pause();
    process.stdin.setRawMode(false);

    // command doesn't contain pipe(s):
    if (arrOpts.indexOf('|') === -1) {
      const spawn = childProcess.spawn;

      process.stdin.pause();
      process.stdin.setRawMode(false);

      proc = spawn(strCommand, arrOpts, {
        stdio: [process.stdin, process.stdout, 'pipe'],
        cwd: process.env.PWD,
        shell: true,
        env: process.env,
      });

      return proc.on('exit', () => {
        process.stdin.setRawMode(true);
        process.stdin.resume();

        return fncCallback();
      });
    }

    const exec = childProcess.exec;

    exec(strFullCommand, {
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
}

module.exports = AUX;
