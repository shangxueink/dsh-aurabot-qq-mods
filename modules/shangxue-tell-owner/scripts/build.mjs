// 构建：清空 lib/，把 src/ 编译进去，再把跑发布包还需要的东西放进 lib/。
// module.json 的 build.out 是 lib，所以发布包里 lib/ 就是模块根目录：
//   lib/index.mjs     入口（加载 ./index.js，和根目录 index.mjs 同一个写法）
//   lib/index.js      tsc 产物（ESM）
//   lib/panel.js      面板组件
//   lib/package.json  {"type":"module"} —— 让 lib 下的 .js 按 ESM 解析
// 仓库根目录的 index.mjs 只给本地开发用（加载 lib/index.js），不进发布包。

import { execFileSync } from 'node:child_process'
import { copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const OUT = join(ROOT, 'lib')
const manifest = JSON.parse(readFileSync(join(ROOT, 'module.json'), 'utf8'))
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
if (manifest.version !== pkg.version) throw new Error(`版本不一致：module.json ${manifest.version} / package.json ${pkg.version}`)

rmSync(OUT, { recursive: true, force: true })
execFileSync(process.execPath, [join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', join(ROOT, 'tsconfig.json')], { stdio: 'inherit' })

copyFileSync(join(ROOT, 'panel.js'), join(OUT, 'panel.js'))
writeFileSync(join(OUT, 'index.mjs'), "export * from './index.js'\nexport { default } from './index.js'\n")
writeFileSync(join(OUT, 'package.json'), JSON.stringify({ type: 'module', private: true }, null, 2) + '\n')

console.log('[build] src/ → lib/ 完成（含 index.mjs、panel.js 与 ESM 标记）')
