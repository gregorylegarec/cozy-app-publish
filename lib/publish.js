const fetch = require('node-fetch')
const colorize = require('../utils/colorize')

module.exports = ({
  registryUrl,
  registryEditor,
  registryToken,
  appSlug,
  appVersion,
  appBuildUrl,
  sha256Sum,
  appType
}, finishCallback) => {
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
  .then(resp => {
    if (resp.status !== 201) {
      return resp.json()
      .then(body => {
        throw new Error(`${resp.status} ${resp.statusText}: ${body.error}`)
      })
    }
    console.log(colorize.blue('Application published!'))
    if (typeof finishCallback === 'function') {
      return finishCallback()
    } else {
      process.exit(0)
    }
  })
  .catch(e => {
    console.log(colorize.red(`Publishing failed: ${e.message}`))
    if (typeof finishCallback === 'function') {
      return finishCallback(e)
    } else {
      process.exit(1)
    }
  })
}
