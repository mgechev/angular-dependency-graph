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

AngularParser.prototype.PATTERNS = {
  directive: {
    name        : /directive\s*\(['"](\w+)['"]\s*,\s*(.*?)[('")]/g,
    dependencies: {
      array : function (name) {
        return new RegExp('directive\\([\'"]' + name + '[\'"].*?,\\s*\\[(.*?)\\s*function', 'gm');
      },
      inline: function (name) {
        return new RegExp('directive\\([\'"]' + name + '[\'"]\\s*,\\s*function.*?\\((.*?)\\)', 'gm');
      },
      inject: function (name) {
        return new RegExp(name + '\\$inject\\s*=\\s*\\[(.*?)\\]', 'gm');
      }
    }
  },
  controller: {
    name        : /controller\s*\(['"](\w+)['"]\s*,\s*(.*?)[('")]/g,
    dependencies: {
      array : function (name) {
        return new RegExp('controller\\([\'"]' + name + '[\'"].*?,\\s*\\[(.*?)\\s*function', 'gm');
      },
      inline: function (name) {
        return new RegExp('controller\\([\'"]' + name + '[\'"]\\s*,\\s*function.*?\\((.*?)\\)', 'gm');
      },
      inject: function (name) {
        return new RegExp(name + '\\$inject\\s*=\\s*\\[(.*?)\\]', 'gm');
      }
    }
  },
  filter: {
    name        : /filter\s*\(['"](\w+)['"]\s*,\s*(.*?)[('")]/g,
    dependencies: {
      array : function (name) {
        return new RegExp('filter\\([\'"]' + name + '[\'"].*?,\\s*\\[(.*?)\\s*function', 'gm');
      },
      inline: function (name) {
        return new RegExp('filter\\([\'"]' + name + '[\'"]\\s*,\\s*function.*?\\((.*?)\\)', 'gm');
      },
      inject: function (name) {
        return new RegExp(name + '\\$inject\\s*=\\s*\\[(.*?)\\]', 'gm');
      }
    }
  },
  service: {
    name        : /factory|service\s*\(['"](\w+)['"]\s*,\s*(.*?)[('")]/g,
    dependencies: {
      array : function (name) {
        return new RegExp('factory|service\\([\'"]' + name + '[\'"].*?,\\s*\\[(.*?)\\s*function', 'gm');
      },
      inline: function (name) {
        return new RegExp('factory|service\\([\'"]' + name + '[\'"]\\s*,\\s*function.*?\\((.*?)\\)', 'gm');
      },
      inject: function (name) {
        return new RegExp(name + '\\$inject\\s*=\\s*\\[(.*?)\\]', 'gm');
      }
    }
  }
};

AngularParser.prototype.parse = function () {
  var files = this.dirReader.getFiles(this.baseDir, /.*\.js$/),
      self = this,
      result = [];
  files.forEach(function (file) {
    result = result.concat(self.parseFile(file));
  });
  this.result = result;
};

AngularParser.prototype.parseFile = function (file) {
  var content = fs.readFileSync(file),
      patterns = this.PATTERNS,
      self = this,
      result = [];
  Object.keys(patterns).forEach(function (component) {
    result = result.concat(self.parseComponent(content, component));
  });
  return result;
};

AngularParser.prototype.parseComponent = function (file, componentType) {

  function getDependencyArray(dependenciesString) {
    var parts = dependenciesString.split(','),
        result = [];
    parts.forEach(function (d) {
      result.push(d.replace(/['"\s]/g, ''));
    });
    return result;
  }

  var component = this.PATTERNS[componentType],
      namePattern = component.name,
      paramRegExps = 'array inject inline',
      result = [],
      currentDependenciesPattern, dependencyString,
      matches, name, componentName, dependencyArray;
  while (matches = namePattern.exec(file)) {
    dependencyString = null;
    name = matches[1];
    // Starting with the once with hightest priority:
    // Array
    // $inject
    // function
    paramRegExps.split(' ').forEach(function (rName) {
      componentName = name;
      if (rName === 'inject') {
        componentName = matches[2]; //the name of the object
      }
      currentDependenciesPattern = component.dependencies[rName](componentName);
      dependencyArray = currentDependenciesPattern.exec(file);
      if (dependencyArray && dependencyArray[1]) {
        dependencyString = dependencyArray[1];
        return;
      }
    });
    if (!dependencyString) {
      console.warn('Cannot find the dependencies for', name);
    } else {
      dependencyArray = getDependencyArray(dependencyString);
      result.push({
        name: name,
        dependencies: dependencyArray
      });
    }
  }
  return result;
};

AngularParser.prototype.getJson = function () {
  return JSON.stringify(this.result);
};

var reader = new DirectoryReader(),
    parser = new AngularParser(dir, reader);

parser.parse();
console.log(parser.getJson());