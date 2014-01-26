module.exports = function (baseDir) {
  var baseDir = AngularParser = require('./angular-parser'),
      DirectoryReader = require('./directory-reader');


  var reader = new DirectoryReader(),
      parser = new AngularParser(baseDir, reader);

  parser.parse();
  console.log(parser.getJson());
};