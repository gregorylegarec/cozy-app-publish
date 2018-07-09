/* eslint-env jest */

const fetch = require('jest-fetch-mock')
jest.doMock('node-fetch', (url, options) => fetch.mockResponse({ status: 201 }))
