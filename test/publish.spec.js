/* eslint-env jest */
global.fetch = require('jest-fetch-mock')

const publish = require('../lib/publish')

function getOptions (buildDir, error) {
  const options = {
    registryEditor: 'cozy',
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

  xit('should work correctly if expected options provided', async () => {
    global.fetch.mockResponseOnce('', {
      status: 201
    })
    // jest.setMock('node-fetch', fetchStub)
    await publish(getOptions())
    expect(fetchStub).toHaveBeenCalledTimes(1)
  })

  xit('should work correctly if no space name provided', async () => {
    const fetchStub = jest.fn().mockResolvedValue(JSON.stringify({
      status: 201
    }))
    jest.doMock('node-fetch', () => fetchStub)

    const options = getOptions()
    delete options.spaceName
    await publish(options)

    expect(fetchStub).toHaveBeenCalledTimes(1)
  })

  xit('should handle error message if the publishing failed with 404', async () => {
    const fetchStub = jest.fn().mockResolvedValue({
      status: 404,
      statusText: '(TEST) Not Found',
      json: () => Promise.resolve(({ error: 'Application slug not found' }))
    })
    jest.doMock('node-fetch', () => fetchStub)

    expect(publish(getOptions(null, 'NotFound'))).rejects.toThrowErrorMatchingSnapshot()
    expect(fetchStub).toHaveBeenCalledTimes(1)
  })

  xit('should handle error message if the publishing failed with an unexpected fetch error', async () => {
    const fetchStub = jest.fn().mockImplementation(async () => Promise.reject('Unexpected fetch Error'))
    expect(publish(getOptions(null, 'Unexpected'))).rejects.toThrowErrorMatchingSnapshot()
    expect(fetchStub).toHaveBeenCalledTimes(1)
  })

})
