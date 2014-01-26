var fs = require('fs'),
    path = require('path');

function DirectoryReader() {}

DirectoryReader.prototype.getFiles = function (dir, pattern) {
  var files = fs.readdirSync(dir),
      self = this,
      result = [], filePath, stat;
  files.forEach(function (f) {
    filePath = path.join(dir, f);
    stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      result = result.concat(self.getFiles(filePath, pattern));
    } else {
      if (!pattern || pattern.test(filePath))
        result.push(filePath);
    }
  });
  return result;
};

DirectoryReader.prototype.getFileContents = function (file) {
  return fs.readFileSync(file);
};

module.exports = DirectoryReader;
