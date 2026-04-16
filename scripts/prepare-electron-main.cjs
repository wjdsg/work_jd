// Author: mjw
// Date: 2026-04-16

const fs = require('fs')
const path = require('path')

const outputDir = path.resolve(__dirname, '..', 'dist-electron')
const source = path.join(outputDir, 'main.js')
const target = path.join(outputDir, 'main.cjs')

if (fs.existsSync(source)) {
  fs.copyFileSync(source, target)
}
