import * as path from "path";
import * as fs from "fs";
import {parse} from "@babel/parser";
import traverse from "@babel/traverse";
import * as babel from "@babel/core";

type Result = Array<{
  key: string;
  deps: Array<string>;
  code: string;
}>;

const transformCodeToCodeAndDeps = (code) => {
  const { code: es5Code } = babel.transform(code, {
    presets: ["@babel/preset-env"],
  });
  const result = { code: es5Code, deps: [] };
  const ast = parse(code, { sourceType: "module" });
  traverse(ast, {
    enter: (token) => {
      if (token.node.type === "ImportDeclaration") {
        result.deps.push(token.node.source.value);
      }
    },
  });
  return result;
};

const transformCSSToJs = (cssCode) => {
  return `
      const str = ${JSON.stringify(cssCode)}
      if (document) {
        const style = document.createElement("style")
        style.innerHTML = str
        document.head.appendChild(style)
      }
      export default str
    `;
};

// '/Users/zhangzihao/zzh/workspace/playground/learn-webpack/01-ast/project_1/a.js' -> 'a.js'
const transformPathToProjectRelativePath = (projectPath, filePath) => {
  return path.relative(projectPath, filePath);
};

// './a.js' -> '/Users/zhangzihao/zzh/workspace/playground/learn-webpack/01-ast/project_1/a.js'
const transformDepRelativePathToAbsolutePath = (filePath, depRelativePath) => {
  return path.resolve(path.dirname(filePath), depRelativePath);
};

const analysisDeps = (filePath, result, projectPath) => {
  let fileContent = fs.readFileSync(filePath).toString();
  if (/\.css$/.test(filePath)) {
    fileContent = transformCSSToJs(fileContent);
  }
  const { code, deps } = transformCodeToCodeAndDeps(fileContent);
  const tokenKey = transformPathToProjectRelativePath(projectPath, filePath);
  // 判断 key 是否存在，存在就跳过
  if (result.find((item) => item.key === tokenKey)) {
    return;
  }
  const newItem = {
    key: tokenKey,
    code,
    deps: deps.map((depItem) =>
      transformPathToProjectRelativePath(
        projectPath,
        transformDepRelativePathToAbsolutePath(filePath, depItem)
      )
    ),
  };
  result.push(newItem);
  // 遍历每个依赖项
  newItem.deps.forEach((depItem) => {
    analysisDeps(path.resolve(projectPath, depItem), result, projectPath);
  });
};

const generateCode = (result: Result) => {
  let code = "";
  code +=
    "var depRelation = [" +
    result
      .map((item) => {
        const { key, deps, code } = item;
        return `{
      key: ${JSON.stringify(key)}, 
      deps: ${JSON.stringify(deps)},
      code: function(require, module, exports){
        ${code}
      }
    }`;
      })
      .join(",") +
    "];\n";
  code += "var modules = {};\n";
  code += `execute(depRelation[0].key)\n`;
  code += `
  function execute(key) {
    if (modules[key]) { return modules[key] }
    var item = depRelation.find(i => i.key === key)
    if (!item) { throw new Error(\`\${item} is not found\`) }
    var pathToKey = (path) => {
      console.log("path", path)
      var dirname = key.substring(0, key.lastIndexOf('/') + 1)
      console.log("dirname", dirname)
      var projectPath = (dirname + path).replace(\/\\.\\\/\/g, '').replace(\/\\\/\\\/\/, '/')
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
  `;
  return code;
};

const _main = () => {
  const result: Result = [];
  const projectRootPath = path.resolve(__dirname, "project_css");
  analysisDeps(
    path.resolve(projectRootPath, "./index.js"),
    result,
    projectRootPath
  );
  const distDirPath = path.join(projectRootPath, "dist");
  fs.mkdirSync(distDirPath);
  fs.writeFileSync(path.join(distDirPath, "bundle.js"), generateCode(result));
};

_main();
