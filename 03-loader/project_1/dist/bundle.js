var depRelation = [{
      key: "index.js", 
      deps: ["dir/a.js","dir/b.js"],
      code: function(require, module, exports){
        "use strict";

var _a = _interopRequireDefault(require("./dir/a.js"));

var _b = _interopRequireDefault(require("./dir/b.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

console.log(_a["default"].getB());
console.log(_b["default"].getA());
      }
    },{
      key: "dir/a.js", 
      deps: ["dir/b.js"],
      code: function(require, module, exports){
        "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _b = _interopRequireDefault(require("./b.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var a = {
  value: 'a',
  getB: function getB() {
    return _b["default"].value + ' from a.js';
  }
};
var _default = a;
exports["default"] = _default;
      }
    },{
      key: "dir/b.js", 
      deps: ["dir/a.js"],
      code: function(require, module, exports){
        "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _a = _interopRequireDefault(require("./a.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var b = {
  value: 'b',
  getA: function getA() {
    return _a["default"].value + ' from b.js';
  }
};
var _default = b;
exports["default"] = _default;
      }
    }];
var modules = {};
execute(depRelation[0].key)

  function execute(key) {
    if (modules[key]) { return modules[key] }
    var item = depRelation.find(i => i.key === key)
    if (!item) { throw new Error(`${item} is not found`) }
    var pathToKey = (path) => {
      console.log("path", path)
      var dirname = key.substring(0, key.lastIndexOf('/') + 1)
      console.log("dirname", dirname)
      var projectPath = (dirname + path).replace(/\.\//g, '').replace(/\/\//, '/')
      console.log("projectPath", projectPath)
      return projectPath
    }
    var require = (path) => {
      return execute(pathToKey(path))
    }
    modules[key] = { __esModule: true }
    var module = { exports: modules[key] }
    item.code(require, module, module.exports)
    return modules[key]
  }
  