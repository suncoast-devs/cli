const axios = require('axios')
const fs = require('fs')
const path = require('path')
const YAML = require('yaml')

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

  const files = manifest.files
  if (files.length === 0) {
    console.error(`There were no files found for the template: '${template}'`)
    return
  }

  files.forEach(file => {
    const dirName = path.dirname(file)

    const url = `https://raw.githubusercontent.com/suncoast-devs/warp-gate/trunk/${template}/${file}`

    fs.mkdirSync(dirName, { recursive: true })

    axios({
      method: 'get',
      url: url,
      responseType: 'stream',
    })
      .then(function (response) {
        response.data.pipe(fs.createWriteStream(file))
        console.log(`Downloaded: ${file}`)
      })
      .catch(function (error) {
        console.error(`Failed to download: ${file}`)
      })
  })
}

exports.warpGate = warpGate
