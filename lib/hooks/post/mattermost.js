const spawn = require('cross-spawn')

module.exports = async options => {
  const { appSlug, appVersion } = options

  const mattermostProcess = spawn.sync(
    'sh',
    [
      '-c',
      `${__dirname}/mattermost.sh ${appSlug} ${appVersion}`
    ],
    {
      stdio: 'inherit'
    }
  )

  if (mattermostProcess.status !== 0) {
    throw new Error(`${mattermostProcess.stderr}`)
  }

  return options
}
