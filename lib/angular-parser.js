function AngularParser(fileContents) {
  this.fileContents = fileContents;
  this.result = null;
}

AngularParser.prototype.PATTERNS = {
  name: function function_name(type) {
    return new RegExp(type + '\\s*\\([\'"](\\w+)[\'"]\\s*,\\s*(.*?)|[(\'")]', 'g');
  },
  dependencies: {
    array: function (name, type) {
      return new RegExp(type + '[\\r\\n\\s]*?\\([\\r\\n\\s]*?[\'"]' + name + '[\'"][\\r\\n\\s]*?,[\\r\\n\\s]*?\\[([\'"$_a-zA-Z,\\n\\s]*?)function', 'g');
    },
    inline: function (name, type) {
      return new RegExp(type + '[\\r\\n\\s]*?\\([\\r\\n\\s]*?[\'"]' + name + '[\'"][\\r\\n\\s]*?,[\\r\\n\\s]*?function[\\r\\n\\s\\w]*?\\(([\'"$_a-zA-Z,\\n\\s]*?)\\)', 'g');
    },
    inject: function (name) {
      return new RegExp(name + '\\$inject[\\s\\S]*?=[\\s\\S]*?\\[([\\s\\S]*?)\\]', 'gm');
    }
  }
};

AngularParser.prototype.COMPONENTS = {
  directive: {
    typeRegExp: 'directive',
    type: 'directive'
  },
  controller: {
    typeRegExp: 'controller',
    type: 'controller'
  },
  filter: {
    typeRegExp: 'filter',
    type: 'filter'
  },
  service: {
    typeRegExp: '(?:factory|service)',
    type: 'service'
  }
};

AngularParser.prototype.parse = function () {
  var content = this.fileContents,
      components = this.COMPONENTS,
      self = this,
      result = [];
  Object.keys(components).forEach(function (component) {
    result = result.concat(self.parseComponent(content, component));
  });
  this.result = result;
};

AngularParser.prototype.parseComponent = function (file, componentType) {

  function getDependencyArray(dependenciesString) {
    var parts = dependenciesString.split(','),
        result = [];
    parts.forEach(function (d) {
      d = d.replace(/['"\s]/g, '');
      if (d) result.push(d);
    });
    return result;
  }

  var component = this.COMPONENTS[componentType],
      componentPattern = component.typeRegExp,
      patterns = this.PATTERNS,
      namePattern = patterns.name(componentPattern),
      paramRegExps = 'array inject inline',
      result = [],
      currentDependenciesPattern, dependencyString,
      matches, name, componentName, dependencyArray;
  while (matches = namePattern.exec(file)) {
    dependencyString = null;
    name = matches[1];
    if (!name) continue;

    // Starting with the once with hightest priority:
    // Array
    // $inject
    // function
    paramRegExps.split(' ').forEach(function (rName) {
      componentName = name;

      if (rName === 'inject') {
        componentName = matches[2]; //the name of the object
      }
      currentDependenciesPattern = patterns.dependencies[rName](componentName, componentPattern);
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
        type: component.type,
        dependencies: dependencyArray
      });
    }
  }
  return result;
};

module.exports = AngularParser;
