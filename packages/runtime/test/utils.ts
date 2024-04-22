/* eslint-disable no-console */

import { CitronNavigator } from '../src/CitronNavigator'
import { AnyRoute } from '../src/Route'
import { RootRoute } from './routes'

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

export function mockHistory() {
  const original = {
    pushState: history.pushState,
    replaceState: history.replaceState,
  }
  const historyMock = {
    pushState: jest.fn(),
    replaceState: jest.fn(),
  }
  history.pushState = historyMock.pushState
  history.replaceState = historyMock.replaceState
  const unMockHistory = () => {
    history.pushState = original.pushState
    history.replaceState = original.replaceState
  }
  return { historyMock, unMockHistory }
}

type TestHashFn<T extends AnyRoute> = (context: {
  /**
   * A function to transform a path according to the current test (with hash or without hash).
   * 
   * Example: if the current test uses hash, `p('/test')` will result in '/#/test'. If it doesn't use hash, the result will be '/test'.
   */
  p: (path: string) => string,
  navigator: CitronNavigator,
  route: T,
}) => void | Promise<any>

type TestHashOptions<T extends AnyRoute> = {
  testFn: TestHashFn<T>,
  locationFactory?: (
    /**
     * Same as `p` in {@link TestHashFn}.
     */
    p: (path: string) => string,
  ) => string,
  navigatorFactory?: () => CitronNavigator,
  routeFactory?: () => T,
}

/**
 * Runs `testFn` for 2 different scenarios: one where the navigator uses hash based URLs and another where it doesn't.
 * @param testFn test function: receives a path builder as parameter
 */
export function testHash<T extends AnyRoute = RootRoute>(testFn: TestHashFn<T>): () => void
export function testHash<T extends AnyRoute = RootRoute>(options: TestHashOptions<T>): () => void
export function testHash<T extends AnyRoute = RootRoute>(fnOrOptions: TestHashFn<T> | TestHashOptions<T>) {
  return () => {
    let navigator: CitronNavigator
    let route: T

    function setup(useHash: boolean) {
      const options: TestHashOptions<T> = typeof fnOrOptions === 'object' ? fnOrOptions : { testFn: fnOrOptions }
      if (options.locationFactory) mockLocation(options.locationFactory(useHash ? path => `/#${path}` : path => path))
      route = options.routeFactory?.() ?? new RootRoute() as unknown as T
      navigator = options.navigatorFactory?.() ?? CitronNavigator.create(route, useHash)
      return options.testFn
    }

    it('with hash based urls', async () => {
      const testFn = setup(true)
      const ogUseHash = navigator.useHash
      navigator.useHash = true
      await testFn({ p: path => `/#${path}`, navigator, route })
      navigator.useHash = ogUseHash
    })

    it('with simple urls', async () => {
      const testFn = setup(false)
      const ogUseHash = navigator.useHash
      navigator.useHash = false
      await testFn({ p: path => path, navigator, route })
      navigator.useHash = ogUseHash
    })
  }
}
