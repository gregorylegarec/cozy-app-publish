/* eslint-env jest */
jest.mock('node-fetch')

const publish = require('../lib/publish')
const fetchFunction = require('./__mocks__/node-fetch')

function getOptions (buildDir, error) {
  const errorEditor = error && `make${error}Error`
  const options = {
    registryEditor: errorEditor || 'cozy',
    registryToken: 'registryTokenForTest123',
    appSlug: 'mock-app',
    appBuildUrl: 'https://mock.getarchive.cc/12345.tar.gz',
    appVersion: '2.1.8-dev.12345',
    registryUrl: 'https://mock.registry.cc',
    spaceName: 'mock_space',
    appType: 'webapp',
    sha256Sum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  }
  if (buildDir) options.buildDir = buildDir
  return options
}

describe('Publish script (helper)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should work correctly if expected options provided', (done) => {
    publish(getOptions(), () => {
      // we use done callback to avoid process.exit which will kill the jest process
      expect(fetchFunction).toHaveBeenCalledTimes(1)
      done()
    })
  })

  it('should work correctly if no space name provided', (done) => {
    const options = getOptions()
    delete options.spaceName
    publish(options, () => {
      // we use done callback to avoid process.exit which will kill the jest process
      expect(fetchFunction).toHaveBeenCalledTimes(1)
      done()
    })
  })

  it('should handle error message if the publishing failed with 404', (done) => {
    publish(getOptions(null, 'NotFound'), (error) => {
      // we use done callback to avoid process.exit which will kill the jest process
      expect(error.message).toMatchSnapshot()
      expect(fetchFunction).toHaveBeenCalledTimes(1)
      done()
    })
  })

  it('should handle error message if the publishing failed with an unexpected fetch error', (done) => {
    publish(getOptions(null, 'Unexpected'), (error) => {
      // we use done callback to avoid process.exit which will kill the jest process
      expect(error.message).toMatchSnapshot()
      expect(fetchFunction).toHaveBeenCalledTimes(1)
      done()
    })
  })

  it('should handle conflict message without throwing errors', (done) => {
    publish(getOptions(null, 'Conflict'), (resp) => {
      // we use done callback to avoid process.exit which will kill the jest process
      expect(resp.status).toBe(409)
      expect(fetchFunction).toHaveBeenCalledTimes(1)
      done()
    })
  })
})
