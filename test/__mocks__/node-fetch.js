/* eslint-env jest */

function fetch (url, options) {
  return new Promise((resolve, reject) => {
    const bodyObject = JSON.parse(options.body)
    process.nextTick(
      () => {
        if (bodyObject.editor === 'makeUnexpectedError') {
          return reject(new Error('(TEST) Unexpected error'))
        } else {
          // ERRORS
          // Notice: fetch throws errors only for network errors
          // 404
          if (bodyObject.editor === 'makeNotFoundError') {
            return resolve({
              status: 404,
              statusText: '(TEST) Not Found',
              json: () => Promise.resolve(({ error: 'Application slug not found' }))
            })
          }
          expect({
            fetchURL: url,
            options
          }).toMatchSnapshot()
          return resolve({ status: 201 })
        }
      }
    )
  })
}

module.exports = jest.fn((url, options) => fetch(url, options))
