var dependencyParser = require('./lib/dependency-parser');

dependencyParser.init(process.argv[2]);
dependencyParser.parse();
console.log(dependencyParser.getAsJson());
