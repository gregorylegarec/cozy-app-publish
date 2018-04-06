const path = require('path')
const spawn = require('cross-spawn')
const publish = require('./publish')
const colorize = require('../utils/colorize')
const getManifestAsObject = require('../utils/getManifestAsObject')
const getTravisVariables = require('../utils/getTravisVariables')
const constants = require('./constants')

const {
  DEFAULT_REGISTRY_URL,
  DEFAULT_BUILD_DIR
} = constants

// finishCallback is for now only used for the test assertions
function travisPublish ({
  registryToken,
  buildDir = DEFAULT_BUILD_DIR,
  registryUrl = DEFAULT_REGISTRY_URL,
  spaceName,
  verbose
}, finishCallback) {
  const {
    TRAVIS_BUILD_DIR,
    TRAVIS_TAG,
    TRAVIS_COMMIT,
    TRAVIS_REPO_SLUG,
    // encrypted variables
    REGISTRY_TOKEN,
    // custom
    BUILD_COMMIT
  } = getTravisVariables()

  // travis build directory
  if (!TRAVIS_BUILD_DIR) throw new Error('No TRAVIS_BUILD_DIR environment variable found. Publishing failed.')

  // registry editor token (required)
  registryToken = registryToken || REGISTRY_TOKEN
  if (!registryToken) {
    throw new Error('Registry token is missing. Publishing failed.')
  }

  // application manifest (required)
  const appManifestObj = getManifestAsObject(
    path.join(TRAVIS_BUILD_DIR, buildDir)
  )

  // registry editor (required)
  const registryEditor = appManifestObj.editor
  if (!registryEditor) {
    throw new Error('Registry editor is missing in the manifest. Publishing failed.')
  }

  // other variables
  const appSlug = appManifestObj.slug
  const appType = appManifestObj.type || 'webapp'

  // get application version to publish
  let appVersion = ''
  if (TRAVIS_TAG) {
    appVersion = TRAVIS_TAG
  } else {
    appVersion = `${appManifestObj.version}-dev.${TRAVIS_COMMIT}`
  }

  // get archive url from github repo
  // FIXME push directly the archive to the registry
  // for now, the registry needs an external URL
  let appBuildUrl = ''
  const githubUrl = `https://github.com/${TRAVIS_REPO_SLUG}/archive`
  const buildHash = BUILD_COMMIT || TRAVIS_COMMIT
  if (TRAVIS_TAG) {
    appBuildUrl = `${githubUrl}/${TRAVIS_TAG}.tar.gz`
  } else {
    appBuildUrl = `${githubUrl}/${buildHash}.tar.gz`
  }

  // get the sha256 hash from the archive from the url
  const shaSumProcess = spawn.sync(
    'sh',
    [
      '-c',
      `curl -sSL --fail "${appBuildUrl}" | shasum -a 256 | cut -d" " -f1`
    ],
    {
      stdio: verbose ? 'inherit' : 'pipe'
    }
  )
  // Note: if the Url don't return an archive or if 404 Not found,
  // the shasum will be the one of the error message from the curl command
  // so no error throwed here whatever the url is
  if (shaSumProcess.status !== 0) {
    throw new Error(`Archive not found from ${appBuildUrl} or shasum computing errored. Publishing failed.`)
  }
  const sha256Sum = shaSumProcess.stdout.toString().replace(/\r?\n|\r/g, '')

  // publish the application on the registry
  console.log(colorize.blue(`Publishing ${appSlug} (version ${appVersion}) from ${appBuildUrl} (${sha256Sum}) to ${registryUrl} (space: ${spaceName || 'default one'})`))

  publish({
    registryUrl,
    registryEditor,
    registryToken,
    spaceName,
    appSlug,
    appVersion,
    appBuildUrl,
    sha256Sum,
    appType
  }, finishCallback)
}

module.exports = travisPublish
