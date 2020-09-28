const axios = require('axios')
const fs = require('fs')
const path = require('path')

async function linesForUrl(url) {
  try {
    const { data } = await axios.get(url)

    const files = data.split('\n').filter(file => file.length > 0)

    return files
  } catch {
    return []
  }
}

async function filesForTemplate(template) {
  return await linesForUrl(`https://raw.githubusercontent.com/suncoast-devs/warp-gate/trunk/${template}/.files`)
}

async function checksForTemplate(template) {
  return await linesForUrl(`https://raw.githubusercontent.com/suncoast-devs/warp-gate/trunk/${template}/.checks`)
}

async function warpGate(template) {
  const checks = await checksForTemplate(template)
  const missingFiles = checks.filter(check => !fs.existsSync(check))

  if (missingFiles.length > 0) {
    console.error(
      `For template '${template}', the following files are missing from your folder: ${missingFiles.join(', ')}`
    )
    return
  }

  const files = await filesForTemplate(template)
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
