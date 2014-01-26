var fs = require('fs'),
    path = require('path'),
    dir = process.argv[2];

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
      if (pattern.test(filePath)) result.push(filePath);
    }
  });
  return result;
};

function AngularParser(base, reader) {
  this.baseDir = base;
  this.dirReader = reader;
  this.result = null;
}

AngularParser.prototype.parse = function () {
  var files = this.dirReader.getFiles(this.baseDir, /.*\.js$/);
};

AngularParser.prototype.getJson = function () {
  return JSON.stringify(this.result);
};

var reader = new DirectoryReader(),
    parser = new AngularParser(dir, reader);

parser.parse();
console.log(parser.getJson());