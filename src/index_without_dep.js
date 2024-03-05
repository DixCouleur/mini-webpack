const fs = require('fs')
const path = require('path')

const log = console.log.bind(console)

const genID = function() {
    let id = 0
    return function() {
        return id++
    }
}()

// 该函数返回代码中的依赖列表
const getDependencies = (code) => {
    // 使用正则表达式匹配代码中的所有 "require" 语句
    const regExp = /require\(['"](.+)['"]\)/g
    const requireStatements = code.matchAll(regExp)
    // 初始化存储依赖模块的数组
    const dependencies = []
    // 遍历所有依赖模块
    for(const match of requireStatements) {
        // 获取模块名称并将其添加到依赖数组中
        dependencies.push(match[1])
    }
    // 返回依赖数组
    return dependencies
}

const createAsset = function(filename) {
    const buffer = fs.readFileSync(filename)
    const content = buffer.toString('utf-8')
    const dependencies = getDependencies(content)
    return {
        id: genID(),
        filename,
        dependencies,
        code: content,
        mapping: {},
    }
}

const createGraph = function(entry) {
    const entryAsset = createAsset(entry)

    const assets = [entryAsset]

    for(const asset of assets) {
        const dirname = path.dirname(asset.filename)
        const dependencies = asset.dependencies

        for(const relativePath of dependencies) {
            const absolutePath = path.join(dirname, relativePath + '.js')
            const child = createAsset(absolutePath)
            asset.mapping[relativePath] = child.id

            assets.push(child)
        }
    }

    return assets
}

const bundle = function(graph) {
    let modules = ''

    graph.forEach(mod => {
        modules += `{
            fn: function(require, module, exports) { 
                ${mod.code}
            },
            mapping: ${JSON.stringify(mod.mapping)},
        },`
    })

    return `
        (function() {
            const modules = [${modules}]
        
            const require = function(id) {
                const { fn, mapping } = modules[id]
                
                const localRequire = function(relativePath) {
                    return require(mapping[relativePath])
                }
                
                const module = { exports: {} }
                
                fn(localRequire, module, module.exports)
                
                return module.exports
            } 
            
            require(0)
        })()
    `
}

const __main = function() {
    const entry = './sample/index.js'

    const graph = createGraph(entry)
    // log('graph', graph)cd 
    const result = bundle(graph)
    log('result', result)

    fs.writeFileSync('./dist/bundle.js', result)
}

__main()
