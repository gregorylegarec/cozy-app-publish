const path = require('path')
const fs = require('fs-extra')
const spawn = require('cross-spawn')
const fetch = require('node-fetch')
const colorize = require('../utils/colorize')

// values from process.env are always string
const getEnv = (name) => process.env[name]

const TRAVIS_PULL_REQUEST = getEnv('TRAVIS_PULL_REQUEST')
const TRAVIS_BRANCH = getEnv('TRAVIS_BRANCH')
const TRAVIS_BUILD_DIR = getEnv('TRAVIS_BUILD_DIR')
const TRAVIS_TAG = getEnv('TRAVIS_TAG')
const TRAVIS_COMMIT = getEnv('TRAVIS_COMMIT')
const TRAVIS_REPO_SLUG = getEnv('TRAVIS_REPO_SLUG')

// encrypted token provided by Travis environment
const REGISTRY_TOKEN = getEnv('REGISTRY_TOKEN')

function publish (cliOptions) {
  // travis build directory
  if (!TRAVIS_BUILD_DIR) throw new Error(colorize.red('No TRAVIS_BUILD_DIR environment variable found. Publishing failed.'))
  const resolveApp = relativePath => path.join(TRAVIS_BUILD_DIR, relativePath)

  // don't publish on pull requests
  if (TRAVIS_PULL_REQUEST !== 'false') {
    console.log()
    console.log(colorize.orange('No publishing: we are in a pull request'))
    console.log()
    process.exit(0)
  }

  // run the script only on the specified branch name
  const branchName = cliOptions.onBranch || 'build'
  if (TRAVIS_BRANCH !== branchName) {
    console.log()
    console.log(colorize.orange(`No publishing: we are not in the branch ${branchName}`))
    console.log(`TRAVIS_BRANCH=${branchName}`)
    console.log()
    process.exit(0)
  }

  // registry editor (required)
  const registryEditor = cliOptions.editor
  if (!registryEditor) {
    throw new Error(colorize.red('Registry editor is missing. Publishing failed.'))
  }

  // registry editor token (required)
  const registryToken = cliOptions.token || REGISTRY_TOKEN
  if (!registryToken) {
    throw new Error(colorize.red('Registry token is missing. Publishing failed.'))
  }

  // application manifest (required)
  const buildDirPath = cliOptions.buildDir || 'build'
  let manifestName = null
  if (fs.existsSync(
    resolveApp(path.join(
      buildDirPath,
      'manifest.webapp'
    ))
  )) {
    manifestName = 'manifest.webapp'
  } else if (fs.existsSync(
    resolveApp(path.join(
      buildDirPath,
      'manifest.konnector'
    ))
  )) {
    manifestName = 'manifest.konnector'
  }
  if (!manifestName) {
    throw new Error(colorize.red('Application manifest file is missing. Publishing failed.'))
  }
  const appManifestObj = fs.readJSONSync(
    resolveApp(path.join(
      buildDirPath,
      manifestName
    ))
  )

  // get application version to publish
  let appVersion = ''
  if (TRAVIS_TAG) {
    appVersion = TRAVIS_TAG
  } else {
    appVersion = `${appManifestObj.version}-dev.${TRAVIS_COMMIT}`
  }

  // other variables
  const registryUrl = cliOptions.registryUrl ||
    'https://staging-apps-registry.cozycloud.cc'
  const appSlug = appManifestObj.slug
  const appType = appManifestObj.type

  // get archive url from github repo
  // FIXME push directly the archive to the registry
  // for now, the registry needs an external URL
  let appBuildUrl = ''
  const githubUrl = `https://github.com/${TRAVIS_REPO_SLUG}/archive`
  if (TRAVIS_TAG) {
    appBuildUrl = `${githubUrl}/${TRAVIS_TAG}.tar.gz`
  } else {
    appBuildUrl = `${githubUrl}/${TRAVIS_COMMIT}.tar.gz`
  }

  // get the sha256 hash from the archive from the url
  const shaSumProcess = spawn.sync(
    'sh',
    [
      '-c',
      `curl -sSL --fail "${appBuildUrl}" | shasum -a 256 | cut -d" " -f1`
    ],
    {
      stdio: cliOptions.verbose ? 'inherit' : 'pipe'
    }
  )
  if (shaSumProcess.status !== 0) {
    throw new Error(colorize.red(`Archive not found from ${appBuildUrl} or shasum computing errored. Publishing failed.`))
  }
  const sha256Sum = shaSumProcess.stdout.toString()

  // publish the application on the registry
  console.log(colorize.blue(`Publishing ${appSlug} (version ${appVersion}) from ${appBuildUrl} (${sha256Sum}) to ${registryUrl}`))

  fetch(`${registryUrl}/registry/${appSlug}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${registryToken}`
    },
    body: JSON.stringify({
      editor: registryEditor,
      version: appVersion,
      url: appBuildUrl,
      sha256: sha256Sum,
      type: appType
    })
  })
  .then(() => {
    console.log(colorize.green('Application published!'))
  })
  .catch(e => {
    throw new Error(colorize.red(`Publishing failed: ${e}`))
  })
}

module.exports = publish
