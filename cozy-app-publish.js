#!/usr/bin/env node

'use strict'

const commander = require('commander')
const colorize = require('./utils/colorize')
const scripts = require('./index')

const pkg = require('./package.json')

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
  .option('--editor <editor-name>', 'the registry editor to publish as (required)')
  .option('--token <editor-token>', 'the registry token matching the provided editor (required)')
  .option('--build-dir <path>', 'path fo the build directory relative to the current directory (default ./build)')
  .option('--build-url <url>', 'URL of the application archive')
  .option('--manual-version <version>', 'publishing a specific version manually (must not be already published in the registry)')
  .option('--on-branch <branch-name>', 'the branch name to run this script on (default: build)')
  .option('--registry-url <url>', 'the registry URL to publish to a different one from the default URL')
  .option('--travis', 'use the script dedicated for Travis CI environments')
  .option('--verbose', 'print additional logs')
  .on('--help', () => {
    console.log()
    console.log(`\t--- ${colorize.bold('USAGE INFORMATIONS')} ---`)
    console.log()
    console.log(`\tThis tool allows you to publish a Cozy application to the Cozy registry.`)
  })
  .parse(process.argv)

publishApp({
  editor: program.editor,
  token: program.token,
  buildDir: program.buildDir,
  buildUrl: program.buildUrl,
  manualVersion: program.manualVersion,
  onBranch: program.onBranch,
  registryUrl: program.registryUrl,
  travis: program.travis,
  verbose: program.verbose
})

function publishApp (cliOptions) {
  if (cliOptions.travis) {
    scripts.travis({
      editor: cliOptions.editor,
      token: cliOptions.token,
      onBranch: cliOptions.onBranch,
      buildDir: cliOptions.buildDir,
      registryUrl: cliOptions.registryUrl,
      verbose: cliOptions.verbose
    })
  } else {
    console.log()
    console.log(colorize.blue('Manual mode usage.'))
    console.log()
    scripts.manual({
      editor: cliOptions.editor,
      token: cliOptions.token,
      buildDir: cliOptions.buildDir,
      buildUrl: cliOptions.buildUrl,
      manualVersion: cliOptions.manualVersion,
      registryUrl: cliOptions.registryUrl,
      verbose: cliOptions.verbose
    })
  }
  process.exit(0)
}
