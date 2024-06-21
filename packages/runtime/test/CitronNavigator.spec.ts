import { CitronNavigator } from '../src/CitronNavigator'
import { NavigationSetupError } from '../src/errors'
import {
  AccountRoute, AlternativeRootRoute, AlternativeRootRouteWithPathClash, AlternativeRootRouteWithStudios, ExtendedAccountRoute, RootRoute,
  SettingsRoute, StudiosRoute, WorkspacesRoute,
} from './routes'
import { delay, expectToFail, mockConsoleLogs, mockLocation, testHash } from './utils'

describe('Citron Navigator', () => {
  let logsMockResult: ReturnType<typeof mockConsoleLogs> | undefined

  beforeEach(() => {
    // @ts-ignore
    CitronNavigator.instance = undefined
    window.addEventListener = jest.fn()
    mockLocation('https://www.stackspot.com')
    logsMockResult = mockConsoleLogs()
  })

  afterEach(() => {
    logsMockResult?.unMockConsoleLogs()
  })

  it('should create', () => {
    const root = new RootRoute()
    const navigator = CitronNavigator.create(root)
    expect(navigator.currentRoute).toBe(root)
    expect(navigator.currentParams).toEqual({})
    expect(navigator.useHash).toBe(true)
  })

  it('should create new instance and retrieve it when called a second time', () => {
    expect(CitronNavigator.instance).toBeUndefined()
    const root = new RootRoute()
    const navigator = CitronNavigator.create(root)
    expect(navigator).toBeInstanceOf(CitronNavigator)
    expect(CitronNavigator.instance).toBe(navigator)
    expect(CitronNavigator.create(new RootRoute())).toBe(navigator)
  })

  it('should observe url changes once instantiated', () => {
    CitronNavigator.create(new RootRoute)
    expect(window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))
  })

  it('should update navigation tree (merging into a branch)', () => {
    const navigator = CitronNavigator.create(new RootRoute())
    const root = (navigator as any).root
    expect(root.account.settings).toBeUndefined()
    navigator.updateNavigationTree(new ExtendedAccountRoute(), 'root.account')
    expect(root.account).not.toBeInstanceOf(AccountRoute)
    expect(root.account).toBeInstanceOf(ExtendedAccountRoute)
    expect((root.account as any).settings).toBeInstanceOf(SettingsRoute)
    expect(root.studios).toBeInstanceOf(StudiosRoute)
  })

  it('should update navigation tree (merging into the root)', () => {
    const navigator = CitronNavigator.create(new RootRoute())
    let root = (navigator as any).root
    expect(root.workspaces).toBeUndefined()
    navigator.updateNavigationTree(new AlternativeRootRoute(), 'root')
    root = (navigator as any).root
    expect(root).not.toBeInstanceOf(RootRoute)
    expect(root).toBeInstanceOf(AlternativeRootRoute)
    expect(root.workspaces).toBeInstanceOf(WorkspacesRoute)
    expect(root.workspaces.$parent).toBeInstanceOf(AlternativeRootRoute)
    expect(root.account).toBeInstanceOf(AccountRoute)
    expect(root.account.$parent).toBeInstanceOf(AlternativeRootRoute)
    expect(root.studios).toBeInstanceOf(StudiosRoute)
    expect(root.studios.$parent).toBeInstanceOf(AlternativeRootRoute)
  })

  it("should fail to update navigation tree if anchor doesn't exist", () => {
    try {
      const navigator = CitronNavigator.create(new RootRoute())
      navigator.updateNavigationTree(new ExtendedAccountRoute(), 'root.inexistent')
      expectToFail()
    } catch (error: any) {
      expect(error).toBeInstanceOf(NavigationSetupError)
    }
  })

  it(
    'should fail to update navigation tree if the new branch has a path that already exists in the current tree and is not a wildcard',
    () => {
      try {
        const navigator = CitronNavigator.create(new RootRoute())
        navigator.updateNavigationTree(new AlternativeRootRouteWithPathClash(), 'root')
        expectToFail()
      } catch (error) {
        expect(error).toBeInstanceOf(NavigationSetupError)
      }
    },
  )

  it(
    'should fail to update navigation tree if the new branch has a key that already exists in the current tree with a non-wildcard path',
    () => {
      try {
        const navigator = CitronNavigator.create(new RootRoute())
        navigator.updateNavigationTree(new AlternativeRootRouteWithStudios(), 'root')
        expectToFail()
      } catch (error) {
        expect(error).toBeInstanceOf(NavigationSetupError)
      }
    },
  )

  describe('should compute the path of a url', testHash(({ p, navigator }) => {
    const path = navigator.getPath(new URL(`https://www.stackspot.com${p('/pt/ai-assistente')}`))
    expect(path).toBe('pt/ai-assistente')
  }))

  describe('should update the current route as the url changes', testHash(({ p, navigator, route: root }) => {
    // root
    expect(navigator.currentRoute).toBe(root)
    expect(navigator.currentParams).toEqual({})
    // account (wildcard)
    mockLocation(`https://www.stackspot.com${p('/account/a/b/test')}`)
    navigator.updateRoute()
    expect(navigator.currentRoute).toBe(root.account)
    expect(navigator.currentParams).toEqual({})
    mockLocation(`https://www.stackspot.com${p('/studios?like=test&limit=20')}`)
    navigator.updateRoute()
    expect(navigator.currentRoute).toBe(root.studios)
    expect(navigator.currentParams).toEqual({ like: 'test', limit: 20 })
    mockLocation(`https://www.stackspot.com${p('/studios/studio1/stacks/stack1/starters/starter1?str=test')}`)
    navigator.updateRoute()
    expect(navigator.currentRoute).toBe(root.studios.studio.stacks.stack.starters.starter)
    expect(navigator.currentParams).toEqual({ studioId: 'studio1', stackId: 'stack1', starterId: 'starter1', str: 'test' })
  }))

  describe('should deserialize route parameters', testHash({
    locationFactory: (p) => {
      const urlParams = [
        'Hello-World', // str
        '42', // num
        'true', // boolT
        'false', // boolF
        'abc-def-ghi', // strArr
        '1-2', // numArr
        'true', // boolArr
        '{"name":"Dalinar Kholin","age":"53","type":"Bondsmith"}', // obj
        '[[1,2,3],[4],[5,6,7]]', // doubleArr
      ]
      const urlParamsStr = urlParams.map(encodeURIComponent).join('/')
      return `https://www.stackspot.com${p('/testRouteParams')}/${urlParamsStr}`
    },
    testFn: ({ navigator }) => {
      expect(navigator.currentParams).toEqual({
        str: 'Hello-World',
        num: 42,
        boolT: true,
        boolF: false,
        obj: { name: 'Dalinar Kholin', age: '53', type: 'Bondsmith' },
        strArr: ['abc', 'def', 'ghi'],
        numArr: [1, 2],
        boolArr: [true],
        doubleArr: [[1, 2, 3], [4], [5, 6, 7]],
      })
      expect(logsMockResult?.consoleMock?.error).not.toHaveBeenCalled()
    },
  }))

  describe('should escape string arrays when deserializing route parameters', () => {
    const strArr = ['Hello', 'Hello-World', 'test--a-b---c', 'World', '']
    testHash({
      locationFactory: (p) => {
        const urlParamsStr = encodeURIComponent(strArr.map(v => v.replace(/-/g, '\\-')).join('-'))
        return `https://www.stackspot.com${p('/testArrayEscape')}/${urlParamsStr}`
      },
      testFn: ({ navigator }) => {
        expect(navigator.currentParams).toEqual({ strArr })
        expect(logsMockResult?.consoleMock?.error).not.toHaveBeenCalled()
      },
    })()
  })

  describe('should deserialize search parameters', testHash({
    locationFactory: (p) => {
      const query = [
        { name: 'str', value: 'Hello World' },
        { name: 'num', value: '42' },
        { name: 'boolT', value: 'true' },
        { name: 'boolT2', value: '' },
        { name: 'boolF', value: 'false' },
        { name: 'obj', value: '{"name":"Dalinar Kholin","age":"53","type":"Bondsmith"}' },
        { name: 'strArr', value: 'abc' },
        { name: 'strArr', value: 'def-ghi' },
        { name: 'strArr', value: 'jkl' },
        { name: 'numArr', value: '1' },
        { name: 'numArr', value: '2' },
        { name: 'boolArr', value: 'true' },
        { name: 'doubleArr', value: '[[1,2,3],[4],[5,6,7]]' },
      ]
      const queryString = query.map(({ name, value }) => `${name}=${encodeURIComponent(value)}`).join('&')
      return `https://www.stackspot.com${p('/testSearchParams')}?${queryString}`
    },
    testFn: ({ navigator }) => {
      expect(navigator.currentParams).toEqual({
        str: 'Hello World',
        num: 42,
        boolT: true,
        boolT2: true,
        boolF: false,
        obj: { name: 'Dalinar Kholin', age: '53', type: 'Bondsmith' },
        strArr: ['abc', 'def-ghi', 'jkl'],
        numArr: [1, 2],
        boolArr: [true],
        doubleArr: [[1, 2, 3], [4], [5, 6, 7]],
      })
      expect(logsMockResult?.consoleMock?.error).not.toHaveBeenCalled()
    },
  }))

  describe('should not deserialize search parameters that are not in the metadata', testHash({
    locationFactory: p => `https://www.stackspot.com${p('/testSearchParams?str=test&inexistent=test')}`,
    testFn: ({ navigator }) => {
      expect(navigator.currentParams).toEqual({ str: 'test' })
      expect(logsMockResult?.consoleMock?.error).not.toHaveBeenCalled()
    },
  }))

  describe('should deserialize parameters of invalid types and log the error', testHash({
    locationFactory: (p) => {
      const query = [
        { name: 'num', value: 'not a number' },
        { name: 'boolT', value: 'not a boolean' },
        { name: 'obj', value: 'not an object' },
        { name: 'numArr', value: '1' },
        { name: 'numArr', value: 'not a number' },
        { name: 'numArr', value: '2' },
        { name: 'numArr', value: 'also not a number' },
        { name: 'boolArr', value: 'true' },
        { name: 'boolArr', value: 'false' },
        { name: 'boolArr', value: 'not a boolean' },
      ]
      const queryString = query.map(({ name, value }) => `${name}=${encodeURIComponent(value)}`).join('&')
      return `https://www.stackspot.com${p('/testSearchParams')}?${queryString}`
    },
    testFn: ({ navigator }) => {
      expect(navigator.currentParams).toEqual({
        num: NaN,
        boolT: true,
        obj: 'not an object',
        numArr: [1, NaN, 2, NaN],
        boolArr: [true, false, true],
      })
      expect(logsMockResult?.consoleMock?.error).toHaveBeenCalledTimes(6)
    },
  }))

  describe('should manage route change listener', testHash(async ({ p, navigator, route: root }) => {
    const listener = jest.fn()
    const removeListener = navigator.onRouteChange(listener)
    expect(listener).toHaveBeenCalledWith(root, {})
    listener.mockClear()
    mockLocation(`https://www.stackspot.com${p('/studios?limit=50')}`)
    await navigator.updateRoute()
    expect(listener).toHaveBeenCalledWith(root.studios, { limit: 50 })
    listener.mockClear()
    removeListener()
    mockLocation(`https://www.stackspot.com${p('/studios/studio1')}`)
    await navigator.updateRoute()
    expect(listener).not.toHaveBeenCalled()
  }))

  describe('should manage async route change listener', testHash(async ({ p, navigator, route: root }) => {
    let counter = 0
    const listener = jest.fn(async () => {
      await delay()
      counter++
    })
    const removeListener = navigator.onRouteChangeAsync(listener)
    expect(listener).toHaveBeenCalledWith(root, {})
    await delay(20)
    expect(counter).toBe(1)
    listener.mockClear()
    mockLocation(`https://www.stackspot.com${p('/studios?limit=50')}`)
    await navigator.updateRoute()
    expect(listener).toHaveBeenCalledWith(root.studios, { limit: 50 })
    expect(counter).toBe(2)
    listener.mockClear()
    removeListener()
    mockLocation(`https://www.stackspot.com${p('/studios/studio1')}`)
    await navigator.updateRoute()
    expect(listener).not.toHaveBeenCalled()
  }))

  describe(
    'async route change listeners should run at once and finish before synchronous listeners start',
    testHash(async ({ p, navigator }) => {
      /* we're going to delay a small amount of time here because creating a navigator yields an async route change event that might
      otherwise run after the listeners below and trigger them again. */
      await delay()
      const counter = [0, 0, 0]
      const asyncListener1 = jest.fn(async () => {
        await delay()
        counter[0]++
      })
      const asyncListener2 = jest.fn(async () => {
        await delay()
        counter[1]++
      })
      const syncListener = jest.fn(() => {
        counter[2]++
      })
      navigator.onRouteChangeAsync(asyncListener1)
      navigator.onRouteChangeAsync(asyncListener2)
      navigator.onRouteChange(syncListener)
      expect(counter).toEqual([0, 0, 1])
      await delay(20)
      expect(counter).toEqual([1, 1, 1])
      asyncListener1.mockClear()
      asyncListener2.mockClear()
      syncListener.mockClear()
      mockLocation(`https://www.stackspot.com${p('/studios')}`)
      const promise = navigator.updateRoute()
      expect(asyncListener1).toHaveBeenCalled()
      expect(asyncListener2).toHaveBeenCalled()
      expect(syncListener).not.toHaveBeenCalled()
      expect(counter).toEqual([1, 1, 1])
      await promise
      expect(syncListener).toHaveBeenCalled()
      expect(counter).toEqual([2, 2, 2])
    }),
  )

  describe('should not call route change listeners when the route is invalid', testHash({
    locationFactory: p => `https://www.stackspot.com${p('/inexistent')}`,
    testFn: async ({ p, navigator }) => {
      const asyncListener = jest.fn()
      const syncListener = jest.fn()
      navigator.onRouteChangeAsync(asyncListener)
      navigator.onRouteChange(syncListener)
      mockLocation(`https://www.stackspot.com${p('/inexistent2')}`)
      await navigator.updateRoute()
      expect(asyncListener).not.toHaveBeenCalled()
      expect(syncListener).not.toHaveBeenCalled()
    },
  }))

  describe('should manage route not found listener', testHash(async ({ p, navigator }) => {
    const listener = jest.fn()
    const removeListener = navigator.onNotFound(listener)
    mockLocation(`https://www.stackspot.com${p('/inexistent')}`)
    navigator.updateRoute()
    expect(listener).toHaveBeenCalledWith('inexistent')
    listener.mockClear()
    removeListener()
    mockLocation(`https://www.stackspot.com${p('/inexistent2')}`)
    await navigator.updateRoute()
    expect(listener).not.toHaveBeenCalled()
  }))
})
