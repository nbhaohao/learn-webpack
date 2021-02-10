import * as babel from "@babel/core";
import { parse } from "@babel/parser";

const code = "let a ='1'; const b ='2';";

const ast = parse(code);
const result = babel.transformFromAstSync(ast, code, {
  presets: ["@babel/preset-env"],
});
console.log(result.code);
/*
输出结果：
var a = '1';
var b = '2';
*/
