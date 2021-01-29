#!/usr/bin/env node

const parseArgs = require('minimist')
const { check } = require('./check')
const { hubCreate } = require('./hubCreate')
const { exec } = require('./utils')
const { warpGate } = require('./warpGate')

var { _: arguments } = parseArgs(process.argv.slice(2))

switch (arguments[0]) {
  case 'check':
    check()
    break

  case 'warp': {
    const template = arguments[1]

    warpGate(template)
    break
  }

  case 'hubCreate': {
    const repoName = arguments[1]

    hubCreate(repoName)
    break
  }

  case 'toast':
    {
      const appName = arguments[1]
      const message = arguments[2]

      if (process.platform === 'win32') {
        exec(`${__dirname}/.bin/snoretoast -silent -m "${message}" -t "${appName}"`)
      } else {
        exec(
          `${__dirname}/.bin/terminal-notifier.app/Contents/MacOS/terminal-notifier -message "${message}" -title "${appName}" -timeout 2`
        )
      }
    }
    break

  default:
    console.log(
      `usage:\nsdg warp TEMPLATE - download the contents of a template\nsdg check - check installed SDG apps\nsdg toast MESSAGE APP - send a toast message`
    )
    break
}
