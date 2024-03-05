const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default

const log = console.log.bind(console)

const genID = function() {
    let _id = 0
    return function() {
        let id = _id
        _id += 1
        return id
    }
}()

const createAsset = function(filename) {
    const buffer = fs.readFileSync(filename)
    const content = buffer.toString('utf-8')

    const ast = parser.parse(content)

    const dependencies = []
    traverse(ast, {
        ImportDeclaration: function({ node }) {
            dependencies.push(node.source.value)
        },
    })

    const { code } = babel.transformFromAstSync(ast, null, {
        presets: ['@babel/preset-env'],
    })

    return {
        id: genID(),
        filename,
        dependencies,
        code,
        mapping: {},
    }
}

const createGraph = function(entry) {
    const mainAsset = createAsset(entry)

    const assets = [mainAsset]

    for(const asset of assets) {
        const dirname = path.dirname(asset.filename)

        asset.dependencies.forEach(relativePath => {
            const absolutePath = path.join(dirname, relativePath + '.js')
            const child = createAsset(absolutePath)
            asset.mapping[relativePath] = child.id

            assets.push(child)
        })
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
    const entry = '../sample/index.js'

    const graph = createGraph(entry)
    // log('graph', graph)
    const result = bundle(graph)
    log('result', result)

    fs.writeFileSync('../dist/bundle.js', result)
}

__main()
