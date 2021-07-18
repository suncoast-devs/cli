const { exec } = require('./utils')
const fs = require('fs')

async function getRepoDetails(user, repoName) {
  const apiDetails = await exec(`hub api /repos/${user.login}/${repoName}`)

  return JSON.parse(apiDetails.stdout)
}

async function createRepo(repoName) {
  return (await exec(`hub create ${repoName}`)).stdout
}

async function hubCreate(repoName) {
  // Look to see if a `.git` directory exists.
  //
  // How could we make sure we don't really do anything if this isn't
  // a real project? (check for package.json or *.csproj)?
  const hasGitDirectory = fs.existsSync('.git')
  if (!hasGitDirectory) {
    // Create an initial git repository and make a commit
    await exec(`git init`)
    await exec(`git add .`)
    await exec(`git commit -m "Initial Commit"`)
  }

  const user = JSON.parse((await exec('hub api user')).stdout)

  // Don't do anything if we don't have a valid hub api user
  if (user.login) {
    // Try up to 20 times to make a github repo (with increasing version numbers in the name)
    for (let copy = 0; copy < 20; copy++) {
      const repoNameToCheck = copy === 0 ? repoName : `${repoName}-${copy}`
      const repoDetails = await getRepoDetails(user, repoNameToCheck)
      if (repoDetails.message === 'Not Found') {
        await createRepo(repoNameToCheck)
        break
      }
    }
  }
}

exports.hubCreate = hubCreate
