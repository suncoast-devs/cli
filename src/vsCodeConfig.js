const JSON = require('@xutl/json')

async function vsCodeConfig() {
  const fileName =
    process.platform === 'win32'
      ? `${process.env.HOME}\\AppData\\Roaming\\Code\\User\\settings.json`
      : `${process.env.HOME}/Library/Application Support/Code/User/settings.json`

  const content = await JSON.read(fileName)

  content['editor.defaultFormatter'] = 'esbenp.prettier-vscode'

  content['editor.formatOnSave'] = true
  content['editor.tabSize'] = 2
  content['javascript.implicitProjectConfig.checkJs'] = true
  content['files.eol'] = '\n'

  content['[csharp]'] ||= {}
  content['[csharp]']['editor.insertSpaces'] = true
  content['[csharp]']['editor.tabSize'] = 4

  await JSON.write(fileName, content)
}

exports.vsCodeConfig = vsCodeConfig
