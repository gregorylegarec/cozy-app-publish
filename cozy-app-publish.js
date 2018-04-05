#!/usr/bin/env node

'use strict'

const commander = require('commander')
const colorize = require('./utils/colorize')
const scripts = require('./index')

const pkg = require('./package.json')

const MODES = {
  TRAVIS: 'travis',
  MANUAL: 'manual'
}

var currentNodeVersion = process.versions.node
var semver = currentNodeVersion.split('.')
var major = semver[0]

if (major < 6) {
  console.error(colorize.red(`You are running Node v${currentNodeVersion}.
    cozy-app-publish requires Node v6 minimum, please update you version of Node.`)
  )
  process.exit(1)
}

const program = new commander.Command(pkg.name)
  .version(pkg.version)
  .usage(`[options]`)
  .option('--token <editor-token>', 'the registry token matching the provided editor (required)')
  .option('--space <space-name>', 'the registry space name to publish the application to (default __default__)')
  .option('--build-dir <relative-path>', 'path fo the build directory relative to the current directory (default ./build)')
  .option('--build-url <url>', 'URL of the application archive')
  .option('--manual-version <version>', 'publishing a specific version manually (must not be already published in the registry)')
  .option('--on-branch <branch-name>', 'the branch name to run this script on (default: master)')
  .option('--registry-url <url>', 'the registry URL to publish to a different one from the default URL')
  .option('--mode <mode>', 'overwrite the automatic mode detection to force using a specific mode')
  .option('--verbose', 'print additional logs')
  .on('--help', () => {
    console.log()
    console.log(`\t--- ${colorize.bold('USAGE INFORMATIONS')} ---`)
    console.log()
    console.log(`\tThis tool allows you to publish a Cozy application to the Cozy registry.`)
  })
  .parse(process.argv)

publishApp({
  token: program.token,
  buildDir: program.buildDir,
  buildUrl: program.buildUrl,
  manualVersion: program.manualVersion,
  onBranch: program.onBranch,
  registryUrl: program.registryUrl,
  space: program.space,
  mode: program.mode,
  verbose: program.verbose
})

function _getPublishMode (modeOption) {
  let modeUsage = null
  switch (modeOption) { // overwriting using the CLI option
    case MODES.TRAVIS:
    case MODES.MANUAL:
      modeUsage = modeOption
      break
  }
  if (!modeUsage) { // auto detection if no CLI option provided
    if (process.env.TRAVIS === 'true') {
      modeUsage = MODES.TRAVIS
    } else { // default mode
      modeUsage = MODES.MANUAL
    }
  }
  return modeUsage
}

function publishApp (cliOptions) {
  const publishMode = _getPublishMode(cliOptions.mode)
  if (publishMode === MODES.TRAVIS) {
    console.log()
    console.log(`${colorize.bold('Travis')} ${colorize.blue('publish mode')}`)
    console.log()
    scripts.travis({
      registryToken: cliOptions.token,
      branchName: cliOptions.onBranch,
      buildDir: cliOptions.buildDir,
      registryUrl: cliOptions.registryUrl,
      spaceName: cliOptions.space,
      verbose: cliOptions.verbose
    })
  } else if (publishMode === MODES.MANUAL) {
    console.log()
    console.log(`${colorize.bold('Manual')} ${colorize.blue('publish mode')}`)
    console.log()
    scripts.manual({
      registryToken: cliOptions.token,
      buildDir: cliOptions.buildDir,
      appBuildUrl: cliOptions.buildUrl,
      manualVersion: cliOptions.manualVersion,
      registryUrl: cliOptions.registryUrl,
      spaceName: cliOptions.space,
      verbose: cliOptions.verbose
    })
  } else {
    // no modes found or detected (should not happen since we have default mode)
    console.log()
    throw new Error('No modes found or detected. Publishing failed.')
  }
}
