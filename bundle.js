const fs = require("fs");
const babylon = require("babylon");
const traverse = require("babel-traverse").default;

function createAsset(filename) {
  const content = fs.readFileSync(filename, "utf-8");
  const ast = babylon.parse(content, {
    sourceType: "module",
  });
  // console.log("ast", ast);

  const dependents = [];
  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      // ??
      // console.log("node", node);
      dependents.push(node.source.value);
    },
  });
}

createAsset("./entry.js");
