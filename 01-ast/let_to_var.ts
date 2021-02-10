import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";

const code = "let a ='1'; const b ='2';";

const ast = parse(code);
traverse(ast, {
  enter: (token) => {
    if (
      token.node.type === "VariableDeclaration" &&
      token.node.kind === "let"
    ) {
      token.node.kind = "var";
    }
  },
});
const result = generate(ast);
console.log(result.code);
/*
输出结果：
var a = '1';
var b = '2';
*/
