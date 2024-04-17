/* eslint-disable no-console */

export function expectToFail() {
  expect(true).toBe(false)
}

export function mockLocation(url: string) {
  Object.defineProperty(window, 'location', {
    value: {
      ...location,
      href: url,
      toString: () => url,
    },
    writable: true,
  })
}

export function mockConsoleLogs() {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  }
  const consoleMock = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
  console.log = consoleMock.log
  console.warn = consoleMock.warn
  console.error = consoleMock.error
  const unMockConsoleLogs = () => {
    console.log = original.log
    console.warn = original.warn
    console.error = original.error
  }
  return { consoleMock, unMockConsoleLogs }
}

export function delay(ms = 10) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })
}
