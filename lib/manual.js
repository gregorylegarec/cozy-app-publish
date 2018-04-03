const path = require('path')
const fs = require('fs-extra')
const spawn = require('cross-spawn')
const publish = require('./publish')
const prompt = require('prompt')
const colorize = require('../utils/colorize')
const getManifestAsObject = require('../utils/getManifestAsObject')
const constants = require('./constants')

const {
  DEFAULT_REGISTRY_URL,
  DEFAULT_BUILD_DIR
} = constants

// override is used only for test to skip prompt (cf prompt.override)
// finishCallback is for now only used for the test assertions
function manualPublish ({
  registryEditor,
  registryToken,
  buildDir = DEFAULT_BUILD_DIR,
  manualVersion,
  registryUrl = DEFAULT_REGISTRY_URL,
  spaceName,
  appBuildUrl,
  verbose
}, override, finishCallback) {
  // registry editor (required)
  if (!registryEditor) {
    throw new Error('Registry editor is missing. Publishing failed.')
  }

  // registry editor token (required)
  if (!registryToken) {
    throw new Error('Registry token is missing. Publishing failed.')
  }

  // application manifest (required)
  const appManifestObj = getManifestAsObject(
    path.join(fs.realpathSync(process.cwd()), buildDir)
  )

  // get application version to publish
  if (!manualVersion) {
    throw new Error('The --manual-version option is required for the manual mode. Publishing failed.')
  }
  const appVersion = manualVersion || appManifestObj.version

  // other variables
  const appSlug = appManifestObj.slug
  const appType = appManifestObj.type || 'webapp'

  // get archive url
  // FIXME push directly the archive to the registry
  // for now, the registry needs an external URL
  if (!appBuildUrl) {
    throw new Error('The --build-url option is required for the manual mode. Publishing failed.')
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
    throw new Error(`Error from archive shasum computing (${appBuildUrl}). Publishing failed.`)
  }
  // remove also the ending line break
  const sha256Sum = shaSumProcess.stdout.toString().replace(/\r?\n|\r/g, '')

  // publish the application on the registry
  console.log(`Attempting to publish ${colorize.bold(appSlug)} (version ${colorize.bold(appVersion)}) from ${colorize.bold(appBuildUrl)} (sha256 ${colorize.bold(sha256Sum)}) to ${colorize.bold(registryUrl)} (space: ${spaceName || 'default one'})`)
  console.log()

  const promptProperties = [
    {
      name: 'confirm',
      description: colorize.orange('Are you sure you want to publish this application above?'),
      pattern: /^y(es)?$|^n(o)?$/i,
      message: 'Yes (y) or No (n)',
      required: true
    }
  ]

  // useful for testing
  if (override) prompt.override = override

  prompt.start()
  prompt.message = colorize.bold('Confirmation:')
  prompt.delimiter = ' '
  prompt.get(promptProperties, function (err, received) {
    console.log()
    if (err) throw new Error(colorize.red(`prompt: ${err}`))
    if (received.confirm.match(/^y(es)?$/i)) {
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
    } else {
      const cancelError = new Error('Publishing manually canceled.')
      console.log(colorize.red(cancelError.message))
      if (typeof finishCallback === 'function') {
        return finishCallback(cancelError)
      } else {
        process.exit(1)
      }
    }
  })
}

module.exports = manualPublish
