const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const projectRoot = path.resolve(__dirname, '..')
const pdfjsRoot = path.join(projectRoot, 'node_modules', 'pdf.js')

function runNpm(args) {
  const result = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    cwd: pdfjsRoot,
    stdio: 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
}

runNpm(['install'])
runNpm(['exec', '--', 'gulp', 'generic'])

function removeSourceMaps(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) removeSourceMaps(entryPath)
    else if (entry.isFile() && entry.name.endsWith('.map')) fs.rmSync(entryPath)
  }
}

removeSourceMaps(path.join(pdfjsRoot, 'build'))
