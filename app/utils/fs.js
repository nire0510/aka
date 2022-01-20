const fs = require('fs');

/**
 * Creates a new directory
 * @param {string} path Directoy path
 * @returns {boolean} True on success, false otherwise
 */
function createDirectory(path) {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, (error) => {
      if (error) {
        return reject(error);
      }

      resolve(true);
    });
  });
}

/**
 * Delete file
 * @param {string} path File path
 * @returns {boolean} True if action succeeded, false otherwise.
 */
function deleteFile(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (error) => {
      if (error) {
        return reject(error);
      }

      resolve(true);
    });
  });
}

/**
 * Checks if path is a directory or if it doesn't exist yet
 * @param {string} path Directory path
 * @returns {boolean} True if path is directory, false otherwise
 */
function isDirectory(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (error, stats) => {
      if (error) {
        return reject(error);
      }

      resolve(stats.isDirectory());
    });
  });
}

/**
 * Get all files in a directory
 * @param {string} path Directoy path
 * @returns {boolean} True on success, false otherwise
 */
async function readDirectory(path) {
  const isDir = await isDirectory(path);

  if (isDir) {
    return new Promise((resolve, reject) => {
      fs.readdir(path, (error, files) => {
        if (error) {
          return reject(error);
        }

        resolve(files);
      });
    });
  }

  return Promise.resolve([]);
}

/**
 * Move all aliases from one folder to another
 * @param {string} sourcePath Source directory path
 * @param {string} targetPath Destination directory path
 * @returns {boolean} True if action succeeded, false otherwise.
 */
async function moveDirectoryContent(sourcePath, targetPath) {
  const isDir = await isDirectory(targetPath);

  // create target directory if not exists:
  if (!isDir) {
    await createDirectory(targetPath);
  }

  return new Promise((resolve, reject) => {
    fs.readdir(sourcePath, (error, files) => {
      if (error) {
        return reject(error);
      }

      files.forEach((file) => {
        fs.rename(`${sourcePath}/${file}`, `${targetPath}/${file}`, (error) => {
          if (error) {
            return reject(error);
          }

          resolve(true);
        });
      });
    });
  });
}

/**
 * Read file content
 * @param {string} path File path
 * @returns {string} File content
 */
function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (error, data) => {
      if (error) {
        return reject(error);
      }

      resolve(data);
    });
  });
}

/**
 * Write file content
 * @param {string} path File path
 * @param {string} data File content
 * @returns {string} File path
 */
function writeFile(path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (error) => {
      if (error) {
        return reject(error);
      }

      resolve(path);
    });
  });
}

module.exports = {
  createDirectory,
  deleteFile,
  isDirectory,
  moveDirectoryContent,
  readDirectory,
  readFile,
  writeFile,
};
