const { Spinner } = require('clui')
const colors = require('@colors/colors/safe')
const emailValidator = require('email-validator')
const Table = require('cli-table3')

const { exec, runCommandAndCheckVersion, runCommandAndCheckRegexp, checkForApp, getJSONFromFile } = require('./utils')

async function check() {
  var spinner = new Spinner('Checking installed packages', ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'])
  spinner.start()

  var table = new Table({ head: [colors.white('App'), colors.white('Status')] })

  const tableRowPush = async (appName, callback) => {
    spinner.message(appName + ' '.repeat(30))

    let rowResult = { ok: false, result: 'Unknown' }

    try {
      rowResult = await callback()
    } catch (ex) {
      rowResult.result = ex.message
    }

    if (rowResult.ok) {
      table.push([appName, colors.green('Ok!')])
    } else {
      table.push([appName, colors.red(rowResult.result ? rowResult.result.trim() : 'Unknown error.')])
    }
  }

  await tableRowPush('Insomnia', insomnia)
  await tableRowPush('Slack', slack)
  await tableRowPush('Firefox', firefox)

  await tableRowPush('Visual Studio Code Extensions', visualStudioCodeExtensions)
  await tableRowPush('app-app', appapp)
  if (process.platform === 'darwin') {
    await tableRowPush('brew', brew)
  }
  await tableRowPush('dotnet', dotnet)
  await tableRowPush('dotnet ASP Code Generator', dotnetCodeGenerator)
  await tableRowPush('dotnet ASPNETCORE_ENVIRONMENT', dotNetAspNetCoreEnvironment)
  await tableRowPush('dotnet Entity Framework', dotnetEntityFramework)
  await tableRowPush('git', git)
  await tableRowPush('git Config', gitConfig)
  await tableRowPush('heroku', heroku)
  await tableRowPush('heroku login', herokuLogin)
  await tableRowPush('hub', hub)
  await tableRowPush('hub configuration', hubConfiguration)
  await tableRowPush('netlify', netlify)
  await tableRowPush('netlify login', netlifyLogin)
  await tableRowPush('node', node)
  await tableRowPush('pgcli', pgcli)
  await tableRowPush('Postgres', postgres)
  await tableRowPush('Postgres running', postgresRunning)
  await tableRowPush('prettier', prettier)
  await tableRowPush('rimraf', rimraf)
  await tableRowPush('SDG Console Database Template', sdgConsoleDatabaseTemplate)
  await tableRowPush('SDG Console Template', sdgConsoleTemplate)
  await tableRowPush('SDG React Template', sdgWebReactTemplate)
  await tableRowPush('SDG Web API Template', sdgWebApiTemplate)
  await tableRowPush('Visual Studio Code', visualStudioCode)
  await tableRowPush('Visual Studio Code Settings', vsCodeSettings)

  spinner.stop()

  console.log(table.toString())
}

async function slack() {
  return checkForApp('slack')
}

async function firefox() {
  return checkForApp('firefox')
}

async function insomnia() {
  return checkForApp('insomnia')
}

async function hubConfiguration() {
  const json = JSON.parse((await exec('hub api user')).stdout)

  if (json.login && json.login.length === 0) {
    return {
      ok: false,
      result: 'Could not determine your github user. Rerun "hub api" to login',
    }
  }

  return { ok: true }
}

async function postgresRunning() {
  const running = (await runCommandAndCheckRegexp('pg_isready', new RegExp(`.*accepting connections.*`))).ok

  if (running) {
    return { ok: true }
  } else {
    return { ok: false, result: 'postgresql is not running' }
  }
}

async function checkVSCodeExtension(answer, extensions, extension) {
  const installed = extensions.includes(extension)

  if (!installed) {
    answer.ok = false
    answer.result += `${extension} not installed.\n`
  }
}

async function visualStudioCodeExtensions() {
  var answer = { ok: true, result: '' }

  const { stdout: extensions } = await exec('code --list-extensions')

  await checkVSCodeExtension(answer, extensions, '2gua.rainbow-brackets')
  await checkVSCodeExtension(answer, extensions, 'streetsidesoftware.code-spell-checker')
  await checkVSCodeExtension(answer, extensions, 'meganrogge.template-string-converter')
  await checkVSCodeExtension(answer, extensions, 'ms-dotnettools.csharp')
  await checkVSCodeExtension(answer, extensions, 'jchannon.csharpextensions')
  await checkVSCodeExtension(answer, extensions, 'jorgeserrano.vscode-csharp-snippets')
  await checkVSCodeExtension(answer, extensions, 'dbaeumer.vscode-eslint')
  await checkVSCodeExtension(answer, extensions, 'ecmel.vscode-html-css')
  await checkVSCodeExtension(answer, extensions, 'esbenp.prettier-vscode')
  await checkVSCodeExtension(answer, extensions, 'Zignd.html-css-class-completion')
  await checkVSCodeExtension(answer, extensions, 'formulahendry.auto-rename-tag')

  return answer
}

async function visualStudioCode() {
  const versionCheck = await runCommandAndCheckVersion('code', 'code --version', /^(?<version>.*)$/m, '1.47.0')

  if (process.platform === 'darwin') {
    const whichCode = (await exec('readlink $(which code)')).stdout.trim()
    if (whichCode.match(/^\/Applications/)) {
      return { ok: true }
    } else {
      return { ok: false, result: 'Visual Studio Code is not installed in /Applications' }
    }
  } else {
    return versionCheck
  }
}

async function git() {
  return await runCommandAndCheckVersion('git', 'git --version', /git version (?<version>\d+\.\d+\.\d+)/, '2.28.0')
}

async function hub() {
  return await runCommandAndCheckVersion('hub', 'hub --version', /git version (?<version>.*)/, '2.28.0')
}

async function dotnet() {
  return await runCommandAndCheckVersion('dotnet', 'dotnet --version', /(?<version>.*)/, '3.1.0')
}

function dotNetAspNetCoreEnvironment() {
  return {
    ok: process.env['ASPNETCORE_ENVIRONMENT'] == 'Development',
    result: 'ASPNETCORE_ENVIRONMENT not set to Development',
  }
}

async function dotnetEntityFramework() {
  return await runCommandAndCheckVersion(
    'dotnet',
    'dotnet tool list --global',
    /dotnet-ef\s+(?<version>.*?)\s+.*/,
    '5.0.2'
  )
}

async function dotnetCodeGenerator() {
  return await runCommandAndCheckVersion(
    'dotnet',
    'dotnet tool list --global',
    /dotnet-aspnet-codegenerator\s+(?<version>.*?)\s+.*/i,
    '5.0.1'
  )
}

async function sdgWebReactTemplate() {
  return await runCommandAndCheckVersion(
    'dotnet',
    'dotnet new --debug:showconfig',
    /SDG\.templates\.Web\.React\.(?<version>[0-9\.]+?)\.nupkg.*/i,
    '4.6.24'
  )
}

async function sdgConsoleDatabaseTemplate() {
  return await runCommandAndCheckVersion(
    'dotnet',
    'dotnet new --debug:showconfig',
    /SDG\.templates\.Console\.Database\.(?<version>[0-9\.]+?)\.nupkg.*/i,
    '1.0.12'
  )
}

async function sdgWebApiTemplate() {
  return await runCommandAndCheckVersion(
    'dotnet',
    'dotnet new --debug:showconfig',
    /SDG\.templates\.Web\.API\.(?<version>[0-9\.]+?)\.nupkg.*/i,
    '2.3.21'
  )
}

async function sdgConsoleTemplate() {
  return await runCommandAndCheckVersion(
    'dotnet',
    'dotnet new --debug:showconfig',
    /SDG\.Templates\.Console\.(?<version>[0-9\.]+?)\.nupkg.*/i,
    '1.2.13'
  )
}

function getUserHome() {
  return process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME']
}

function vsCodeSettings() {
  const json = getJSONFromFile(
    process.platform === 'win32'
      ? `${getUserHome()}\\AppData\\Roaming\\Code\\User\\settings.json`
      : `${getUserHome()}/Library/Application Support/Code/User/settings.json`
  )

  let answer = { ok: true, result: '' }

  if (json['editor.formatOnSave'] !== true) {
    answer.ok = false
    answer.result += '"editor.formatOnSave" is not set correctly\n'
  }

  if (json['editor.tabSize'] !== 2) {
    answer.ok = false
    answer.result += '"editor.tabSize" is not set correctly\n'
  }

  if (json['js/ts.implicitProjectConfig.checkJs'] !== true) {
    answer.ok = false
    answer.result += '"javascript.implicitProjectConfig.checkJs" is not set correctly\n'
  }

  if (json['[csharp]']['editor.insertSpaces'] !== true) {
    answer.ok = false
    answer.result += '[csharp]editor.insertSpaces is not set correctly\n'
  }

  if (json['[csharp]']['editor.tabSize'] !== 4) {
    answer.ok = false
    answer.result += '[csharp]editor.tabSize is not set correctly\n'
  }

  if (json['[csharp]']['editor.defaultFormatter'] !== 'ms-dotnettools.csharp') {
    answer.ok = false
    answer.result += '[csharp]editor.defaultFormatter is not set correctly\n'
  }

  if (json['editor.defaultFormatter'] !== 'esbenp.prettier-vscode') {
    answer.ok = false
    answer.result += 'editor.defaultFormatter is not set correctly\n'
  }

  if (json['git.enableSmartCommit'] !== true) {
    answer.ok = false
    answer.result += 'git.enableSmartCommit'
  }

  return answer
}

async function gitConfig() {
  let answer = { ok: true, result: '' }

  const userName = (await exec('git config --global user.name')).stdout.trim()
  if (userName.length === 0 || `${userName}`.toLowerCase().includes('example')) {
    answer.ok = false
    answer.result += 'user.name not configured\n'
  }

  const email = (await exec('git config --global user.email')).stdout.trim()
  if (!emailValidator.validate(email) || `${email}`.toLowerCase().includes('example')) {
    answer.ok = false
    answer.result += 'user.email not configured correctly\n'
  }

  const hubApi = JSON.parse((await exec('hub api user')).stdout || '{}')
  const hubUserName = (hubApi.name || '').trim()
  const hubEmail = (hubApi.email || '').trim()

  if (hubUserName && hubUserName !== userName) {
    answer.ok = false
    answer.result += `user.name (${userName}) does not match what you have on Github (${hubUserName})\n`
  }

  if (hubEmail && hubEmail !== email) {
    answer.ok = false
    answer.result += `user.email (${email}) does not match what you have on Github (${hubEmail})\n`
  }

  if ((await exec('git config --global github.user')).stdout.length === 0) {
    answer.ok = false
    answer.result += 'github.user not configured\n'
  }

  if ((await exec('git config --global core.editor')).stdout.trim() != 'code --wait') {
    answer.ok = false
    answer.result += 'core.editor not configured correctly\n'
  }

  if ((await exec('git config --global hub.protocol')).stdout.trim() != 'https') {
    answer.ok = false
    answer.result += 'hub.protocol not configured correctly'
  }

  return answer
}

async function postgres() {
  return await runCommandAndCheckVersion(
    'postgres',
    'postgres --version',
    /postgres \(PostgreSQL\) (?<version>.*?)$/m,
    '12.0'
  )
}

async function pgcli() {
  return await runCommandAndCheckVersion('pgcli', 'pgcli --version', /Version: (?<version>.*?)$/m, '3.0.0')
}

async function node() {
  return await runCommandAndCheckVersion('node', 'node --version', /(?<version>.*?)$/m, '14.6.0')
}

async function netlify() {
  return await runCommandAndCheckVersion('netlify', 'netlify --version', /netlify-cli\/(?<version>.*?) /, '2.53.0')
}

async function netlifyLogin() {
  const stdout = (await exec('netlify status')).stdout.trim()

  const {
    groups: { email },
  } = stdout.match(/Email: \x1B\[39m *(?<email>.*)/) || {
    groups: { email: '' },
  }

  if (!emailValidator.validate(email)) {
    return { ok: false, result: 'Could not identify your netlify account' }
  } else {
    return { ok: true }
  }
}

async function heroku() {
  return await runCommandAndCheckVersion('heroku', 'heroku --version', /heroku\/(?<version>.*?) /, '7.42.6')
}

async function herokuLogin() {
  if (!emailValidator.validate((await exec('heroku auth:whoami')).stdout.trim())) {
    return { ok: false, result: 'Could not identify your heroku account' }
  } else {
    return { ok: true }
  }
}

async function appapp() {
  return await runCommandAndCheckVersion('app-app', 'app-app --version', /(?<version>.*?)$/m, '5.2.8')
}

async function rimraf() {
  return await runCommandAndCheckVersion('rimraf', 'npm list --global --depth 0', /rimraf@(?<version>.*?)$/m, '3.0.2')
}

async function prettier() {
  return await runCommandAndCheckVersion('prettier', 'prettier --version', /(?<version>.*?)$/m, '2.0.5')
}

async function brew() {
  const versionCheck = await runCommandAndCheckVersion(
    'brew',
    'brew config',
    /HOMEBREW_VERSION: (?<version>.*)$/im,
    '2.7.6'
  )

  if (!versionCheck.ok) {
    return versionCheck
  }

  const homebrewDir = (await exec("brew config | grep HOMEBREW_PREFIX| awk -F':' '{print $2}'")).stdout.trim()
  const findResult = (await exec(`find '${homebrewDir}' -type f -uid root 2>&1`)).stdout.trim()

  return { ok: findResult.length === 0, result: `Some files in ${homebrewDir} are owned by 'root'.` }
}

exports.check = check
