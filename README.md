# Build-Your-Own-Webpack

## 原理
*   1、解析一个文件及其依赖
*   2、构建一个依赖关系图
*   3、将所有东西打包成一个单文件

## 代码实现

#### 1、解析文件及其依赖
通过babylon将文件解析成AST
[在线解析器](https://astexplorer.net/)：
![image](https://user-images.githubusercontent.com/3964466/78567304-0e8d9580-7853-11ea-98d2-c7ccdd7153ac.png)


代码实现：
bundle.js
```
const fs = require("fs");
const babylon = require("babylon");
const traverse = require("babel-traverse").default;

let ID = 0;

function createAsset(filename) {
  const content = fs.readFileSync(filename, "utf-8");
  // 解析文件成AST
  const ast = babylon.parse(content, {
    sourceType: "module",
  });

  const dependencies = [];
  // 根据AST获取相关依赖
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

const mainAssets = createAsset("./example/entry.js");

console.log(mainAssets)

```
输出结果：
![image](https://user-images.githubusercontent.com/3964466/78567360-22d19280-7853-11ea-8055-7d664c3343fa.png)


#### 2、构建一个依赖关系图
```
// 构建一个依赖关系图
function createGraph(entry) {
  const mainAssets = createAsset(entry);

  const queue = [mainAssets];

  for (const asset of queue) {
    const dirname = path.dirname(asset.filename);

    asset.mapping = {};

    asset.dependencies.forEach((relativePath) => {
      const absolutePath = path.join(dirname, relativePath);

      const child = createAsset(absolutePath);

      asset.mapping[relativePath] = child.id;

      queue.push(child);
    });
  }
  return queue;
}

const graph = createGraph("./example/entry.js");
console.log(graph);
```
输出结果：
![image](https://user-images.githubusercontent.com/3964466/78567385-2e24be00-7853-11ea-93c4-0bbe4199a67f.png)

#### 3、将所有东西打包成一个单文件
在解析文件时，使用babel对代码进行转译
```
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
  // 使用babel对代码进行转译
  const { code } = babel.transformFromAst(ast, null, {
    presets: ["env"],
  });

  return {
    id,
    filename,
    dependencies,
    code,
  };
}
```

```
// 将所有东西打包成一个单文件
function bundle(graph) {
  let modules = "";

  graph.forEach((mod) => {
    modules += `${mod.id}:[
      function(require,module,exports){
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)}
    ],`;
  });
  const result = `
   (function(modules){
     function require(id){
       const [fn, mapping] = modules[id];
        
        // 因为代码引入文件时根据相对路径，所以需要把相对路径跟id进行一个映射
       function localRequire(relativePath){
         return require(mapping[relativePath])
       }

       const module = {exports:{}};

       fn(localRequire,module,module.exports)

       return module.exports;
     }
     // 执行入口模块
     require(0);
   })({${modules}})
   `;

  return result;
}

const graph = createGraph("./example/entry.js");
const result = bundle(graph);
console.log(result);

```
输出结果：
```
(function(modules) {
    function require(id) {
        const [fn, mapping] = modules[id];

        function localRequire(relativePath) {
            return require(mapping[relativePath])
        }

        const module = {
            exports: {}
        };

        fn(localRequire, module, module.exports)

        return module.exports;
    }
    require(0);
})({
    0: [
        function(require, module, exports) {
            "use strict";

            var _message = require("./message.js");

            var _message2 = _interopRequireDefault(_message);

            function _interopRequireDefault(obj) {
                return obj && obj.__esModule ? obj : {
                    default: obj
                };
            }

            console.log(_message2.default);
        },
        {
            "./message.js": 1
        }
    ],
    1: [
        function(require, module, exports) {
            "use strict";

            Object.defineProperty(exports, "__esModule", {
                value: true
            });

            var _name = require("./name.js");

            exports.default = "hello " + _name.name + "!";
        },
        {
            "./name.js": 2
        }
    ],
    2: [
        function(require, module, exports) {
            "use strict";

            Object.defineProperty(exports, "__esModule", {
                value: true
            });
            var name = exports.name = 'Aaron';
        },
        {}
    ],
})
```
把代码复制到浏览器运行，执行成功！
![image](https://user-images.githubusercontent.com/3964466/78567412-3b41ad00-7853-11ea-88ec-fe6b1932f0cc.png)

一个简易版的Webapck完成了。

## 相关链接
[例子源码](https://github.com/jiajunlin/Build-Your-Own-Webpack)
[视频教程](https://www.youtube.com/watch?v=Gc9-7PBqOC8)
[babylon](https://www.npmjs.com/package/babylon)
[babel-traverse docs](https://github.com/jamiebuilds/babel-handbook/blob/master/translations/en/plugin-handbook.md#babel-traverse)
