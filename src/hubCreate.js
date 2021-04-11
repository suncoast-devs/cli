const { exec } = require('./utils')
const childProcess = require('child_process')

async function getRepoDetails(user, repoName) {
  const apiDetails = await exec(`hub api /repos/${user.login}/${repoName}`)

  console.log({ apiDetails })

  return JSON.parse(apiDetails.stdout)
}

async function createRepo(repoName) {
  return (await exec(`hub create ${repoName}`)).stdout
}

async function hubCreate(repoName) {
  const user = JSON.parse((await exec('hub api user')).stdout)

  console.log({ user })

  for (let copy = 0; ; copy++) {
    const repoNameToCheck = copy === 0 ? repoName : `${repoName}-${copy}`
    const repoDetails = await getRepoDetails(user, repoNameToCheck)
    if (repoDetails.message === 'Not Found') {
      console.log(await createRepo(repoNameToCheck))
      break
    }
  }
}

exports.hubCreate = hubCreate
