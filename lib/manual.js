const path = require('path')
const fs = require('fs-extra')
const spawn = require('cross-spawn')
const fetch = require('node-fetch')
const prompt = require('prompt')
const colorize = require('../utils/colorize')

const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = relativePath => path.resolve(appDirectory, relativePath)

function publish (cliOptions) {
  // registry editor (required)
  const registryEditor = cliOptions.editor
  if (!registryEditor) {
    throw new Error(colorize.red('Registry editor is missing. Publishing failed.'))
  }

  // registry editor token (required)
  const registryToken = cliOptions.token
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
  if (!cliOptions.manualVersion) {
    throw new Error(colorize.red('The --manual-version option is required for the manual mode. Publishing failed.'))
  }
  const appVersion = cliOptions.manualVersion

  // other variables
  const registryUrl = cliOptions.registryUrl ||
    'https://staging-apps-registry.cozycloud.cc'
  const appSlug = appManifestObj.slug
  const appType = appManifestObj.type || 'webapp'

  // get archive url
  // FIXME push directly the archive to the registry
  // for now, the registry needs an external URL
  if (!cliOptions.buildUrl) {
    throw new Error(colorize.red('The --build-url option is required for the manual mode. Publishing failed.'))
  }
  const appBuildUrl = cliOptions.buildUrl

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
  // remove also the ending line break
  const sha256Sum = shaSumProcess.stdout.toString().replace(/\r?\n|\r/g, '')

  // publish the application on the registry
  console.log(`Attempting to publish ${colorize.bold(appSlug)} (version ${colorize.bold(appVersion)}) from ${colorize.bold(appBuildUrl)} (sha256 ${colorize.bold(sha256Sum)}) to ${colorize.bold(registryUrl)}`)
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

  prompt.start()
  prompt.message = colorize.bold('Confirmation:')
  prompt.delimiter = ' '
  prompt.get(promptProperties, function (err, received) {
    console.log()
    if (err) throw new Error(colorize.red(`prompt: ${err}`))
    if (received.confirm.match(/^y(es)?$/i)) {
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
      .then(async resp => {
        if (resp.status !== 201) {
          const body = await resp.json()
          throw new Error(`${resp.status} ${resp.statusText}: ${body.error}`)
        }
        console.log(colorize.blue('Application published!'))
        process.exit(0)
      })
      .catch(e => {
        console.log(colorize.red(`Publishing failed: ${e.message}`))
        process.exit(1)
      })
    } else {
      console.log(colorize.red('Publishing manually canceled.'))
      process.exit(1)
    }
  })
}

module.exports = publish
