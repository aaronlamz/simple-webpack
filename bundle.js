const fs = require("fs");
const babylon = require("babylon");
const traverse = require("babel-traverse").default;

let ID = 0;

// 解析一个文件及其依赖
function createAsset(filename) {
  const content = fs.readFileSync(filename, "utf-8");
  const ast = babylon.parse(content, {
    sourceType: "module",
  });

  const dependencies = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  const id = ID++;

  return {
    id,
    filename,
    dependencies,
  };
}

// 构建一个依赖关系图
function createGraph(entry) {
  const mainAssets = createAsset(entry);
}

const graph = createAsset("./example/entry.js");
console.log(graph);
