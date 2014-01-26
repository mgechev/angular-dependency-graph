var DirectoryReader = require('./directory-reader'),
    AngularParser   = require('./angular-parser');
module.exports = {

  init: function (baseDir) {
    this.baseDir = baseDir;
    this.reader = new DirectoryReader();
  },
  parse: function () {
    var files = this.reader.getFiles(this.baseDir, /\.js$/),
        result = [],
        self = this,
        ngParser;
    files.forEach(function (file) {
      ngParser = new AngularParser(self.reader.getFileContents(file));
      ngParser.parse();
      result = result.concat(ngParser.result);
    });
    this.result = result;
  },
  getAsJson: function () {
    return JSON.stringify(this.result);
  }
};