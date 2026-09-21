const fs = require('fs');
const path = require('path');

class FileManagerHybrid {
  constructor(baseDir = './data-hybrid') {
    this.baseDir = baseDir;
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
      console.log('Создана директория: ' + baseDir);
    }
  }

  createFile(filename, content, callback) {
    const filePath = path.join(this.baseDir, filename);

    if (typeof callback === 'function') {
      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, filePath);
      });
      return;
    }

    return fs.promises.writeFile(filePath, content, 'utf8').then(() => filePath);
  }

  readFile(filename, callback) {
    const filePath = path.join(this.baseDir, filename);

    if (typeof callback === 'function') {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, data);
      });
      return;
    }

    return fs.promises.readFile(filePath, 'utf8');
  }

  getFileStats(filename, callback) {
    const filePath = path.join(this.baseDir, filename);

    const format = (stats) => ({
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile()
    });

    if (typeof callback === 'function') {
      fs.stat(filePath, (err, stats) => {
        if (err) {
          callback(err, null);
          return;
        }
        callback(null, format(stats));
      });
      return;
    }

    return fs.promises.stat(filePath).then(format);
  }

  deleteFile(filename, callback) {
    const filePath = path.join(this.baseDir, filename);

    if (typeof callback === 'function') {
      fs.unlink(filePath, (err) => {
        if (err) {
          callback(err);
          return;
        }
        callback(null);
      });
      return;
    }

    return fs.promises.unlink(filePath);
  }

  listFiles(callback) {
    const work = async () => {
      const entries = await fs.promises.readdir(this.baseDir);
      const results = await Promise.all(
        entries.map(async (name) => {
          const stats = await fs.promises.stat(path.join(this.baseDir, name));
          return { name: name, isFile: stats.isFile() };
        })
      );
      return results.filter((r) => r.isFile).map((r) => r.name);
    };

    if (typeof callback === 'function') {
      work()
        .then((files) => callback(null, files))
        .catch((err) => callback(err, null));
      return;
    }

    return work();
  }
}

module.exports = FileManagerHybrid;