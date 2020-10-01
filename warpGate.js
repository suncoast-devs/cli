const axios = require('axios')
const fs = require('fs')
const path = require('path')
const YAML = require('yaml')
const { exec } = require('./utils')
const childProcess = require('child_process')

async function getManifest(template) {
  try {
    const { data } = await axios.get(
      `https://raw.githubusercontent.com/suncoast-devs/warp-gate/trunk/${template}/manifest.yml`
    )

    return YAML.parse(data)
  } catch {
    return { files: [], checks: { files: [] } }
  }
}

function executeCommand(command, args) {
  const { stderr, status } = childProcess.spawnSync(command, args)

  if (status !== 0) {
    console.log('Error:')
    console.log(stderr)
  } else {
    console.log('Done!')
  }
}

async function warpGate(template) {
  const manifest = await getManifest(template)
  const checks = manifest.checks

  const missingFiles = checks.exists ? checks.exists.filter(file => !fs.existsSync(file)) : []

  if (missingFiles.length > 0) {
    console.error(
      `For template '${template}', the following files are missing from your folder: ${missingFiles.join(', ')}`
    )
    return
  }

  const { files, packages } = manifest

  if (files.length === 0) {
    console.error(`There were no files found for the template: '${template}'`)
    return
  }

  const filePromises = files.map(file =>
    axios({
      method: 'get',
      url: `https://raw.githubusercontent.com/suncoast-devs/warp-gate/trunk/${template}/${file}`,
      responseType: 'stream',
    })
  )

  const fileResults = await Promise.all(filePromises)

  fileResults.forEach((axiosResult, index) => {
    const file = files[index]

    if (axiosResult.status === 200) {
      fs.mkdirSync(path.dirname(file), { recursive: true })

      axiosResult.data.pipe(fs.createWriteStream(file))
      console.log(`Downloaded: ${file}`)
    } else {
      console.error(`Failed to download: ${file}`)
    }
  })

  if (packages) {
    const { add, remove } = packages

    const isYarn = fs.existsSync('yarn.lock')
    const isNpm = fs.existsSync('package-lock.json')

    Array(add)
      .filter(Boolean)
      .flat()
      .forEach(addPackage => {
        if (isYarn) {
          process.stdout.write(`yarn: adding package ${addPackage} => `)
          executeCommand('yarn', ['add', addPackage])
        } else {
          if (isNpm) {
            process.stdout.write(`npm: adding package ${addPackage} => `)
            executeCommand('npm', ['install', addPackage])
          }
        }
      })

    Array(remove)
      .filter(Boolean)
      .flat()
      .forEach(removePackage => {
        if (isYarn) {
          console.log(`yarn: adding package ${removePackage}`)
          executeCommand('yarn', ['remove', removePackage])
        } else {
          if (isNpm) {
            console.log(`npm: adding package ${removePackage}`)
            executeCommand('npm', ['uninstall', removePackage])
          }
        }
      })
  }
}

exports.warpGate = warpGate
