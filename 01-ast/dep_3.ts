import * as path from "path";
import * as fs from "fs";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

interface Result {
  [key: string]: {
    deps: Array<string>;
    code: string;
  };
}

const transformCodeToCodeAndDeps = (code) => {
  const result = { code, deps: [] };
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

// '/Users/zhangzihao/zzh/workspace/playground/learn-webpack/01-ast/project_1/a.js' -> 'a.js'
const transformPathToProjectRelativePath = (projectPath, filePath) => {
  return path.relative(projectPath, filePath);
};

// './a.js' -> '/Users/zhangzihao/zzh/workspace/playground/learn-webpack/01-ast/project_1/a.js'
const transformDepRelativePathToAbsolutePath = (filePath, depRelativePath) => {
  return path.resolve(path.dirname(filePath), depRelativePath);
};

const analysisDeps = (filePath, result, projectPath) => {
  const { code, deps } = transformCodeToCodeAndDeps(
    fs.readFileSync(filePath).toString()
  );
  const tokenKey = transformPathToProjectRelativePath(projectPath, filePath);
  // 判断 key 是否存在，存在就跳过
  if (result[tokenKey]) {
    return;
  }
  result[tokenKey] = {
    code,
    deps: deps.map((depItem) =>
      transformPathToProjectRelativePath(
        projectPath,
        transformDepRelativePathToAbsolutePath(filePath, depItem)
      )
    ),
  };
  // 遍历每个依赖项
  result[tokenKey].deps.forEach((depItem) => {
    analysisDeps(path.resolve(projectPath, depItem), result, projectPath);
  });
};

const _main = () => {
  const result: Result = {};
  const projectRootPath = path.resolve(__dirname, "project_3");
  analysisDeps(
    path.resolve(projectRootPath, "./index.js"),
    result,
    projectRootPath
  );
  console.log(result);
};

_main();
