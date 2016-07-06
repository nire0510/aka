'use strict';

var fs = require('fs');
var path = require('path');

class AUX {
  /**
   * Generates a new alias (max + 1)
   * @param {string[]} arrKeys Array of existing aliases aliases
   * @returns {string} New alias
   */
  static generateAlias (arrKeys) {
    let intMaxId = Math.max.apply(null, arrKeys.filter((strKey) => /^\d+$/.test(strKey))
      .map((strNumber) => parseInt(strNumber)));

    return intMaxId !== -Infinity && (intMaxId + 1).toString() || '1';
  }

  /**
   * Checks if path is a directory or if it doesn't exist yet
   * @param {string} strPathName Path
   * @returns {boolean} True if path is directory, false otherwise
   */
  static isDirectory (strPathName) {
    var objStats;

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
  static createDirectory (strPathName) {
    fs.mkdirSync(strPathName);

    return true;
  }

  /**
   * Move all aliases from one folder to another
   * @param strSourcePath
   * @param strTargetPath
   */
  static moveDirectoryContent (strSourcePath, strTargetPath) {
    // create target directory if not exists:
    if (!this.isDirectory(strTargetPath)) {
      this.createDirectory(strTargetPath);
    }

    // No migration, just setup:
    fs.readdirSync(strSourcePath).forEach((strFileName) => {
      fs.renameSync(path.join(strSourcePath, strFileName), path.join(strTargetPath, strFileName))
    });

    return true;
  }

  /**
   * Creates a shell
   * @param {string} strCommand Command
   * @param {object[]} arrOpts Command pptions
   * @param {boolean} blnSpawn Is spawn mode required?
   * @param {function} fncCallback Callback function
   * @returns {*}
   * @private
   */
  static shell(strCommand, arrOpts, blnSpawn, fncCallback) {
    if (blnSpawn) {
      let spawn = require('child_process').spawn,
        proc;

      process.stdin.pause();
      process.stdin.setRawMode(false);

      proc = spawn(strCommand, arrOpts, {
        stdio: [process.stdin, process.stdout, 'pipe'],
        cwd: process.env.PWD,
        shell: true,
        env: process.env
      });

      return proc.on('exit', function() {
        process.stdin.setRawMode(true);
        process.stdin.resume();

        return fncCallback();
      });
    }
    else {
      let exec = require('child_process').exec,
        strFullCommand = `${strCommand} ${arrOpts.join(' ')}`;

      exec(strFullCommand, {
        cwd: process.env.PWD,
        env: process.env
      }, function (err, stdout, stderr) {
        if (err) {
          throw err;
        }

        console.log(stdout);
      });
    }
  }
}

module.exports = AUX;