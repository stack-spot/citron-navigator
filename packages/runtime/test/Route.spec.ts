import { AnyRoute } from '../src/Route'
import { NavigatorMock } from './NavigatorMock'
import { RootRoute } from './routes'
import { mockHistory, testHash } from './utils'

describe('Route', () => {
  const root = new RootRoute()
  const navigator = new NavigatorMock(root)

  beforeEach(() => {
    navigator.reset()
  })

  afterAll(() => {
    navigator.unMock()
  })

  it('should create route', () => {
    expect(root.$key).toBe('root')
    expect(root.$path).toBe('/')
    expect(root.$parent).toBeUndefined()
    expect(root.$paramMetadata).toEqual({})
    expect(root.studios.$key).toBe('root.studios')
    expect(root.studios.$path).toBe('/studios')
    expect(root.studios.$parent).toBe(root)
    expect(root.studios.$paramMetadata).toEqual({ like: 'string', limit: 'number' })
  })

  describe('should create links', testHash(({ p }) => {
    expect(root.$link()).toBe(p('/'))
    expect(root.studios.$link()).toBe(p('/studios'))
    expect(root.studios.$link({ like: 'test' })).toBe(p('/studios?like=test'))
    expect(root.studios.studio.$link({ studioId: 'studio1' })).toBe(p('/studios/studio1'))
  }))

  describe('should create links merging current with new parameters', testHash(({ p }) => {
    navigator.currentParams = { studioId: 'test', type: 'own' }
    const stacks = root.studios.studio.stacks as AnyRoute
    const stack = root.studios.studio.stacks.stack as AnyRoute
    expect(stacks.$link({ limit: 10 }, { mergeSearchParameters: true })).toBe(p('/studios/test/stacks?type=own&limit=10'))
    expect(stacks.$link({ studioId: 'another' }, { mergeSearchParameters: true })).toBe(p('/studios/another/stacks?type=own'))
    expect(stacks.$link({ limit: 10, type: 'all' }, { mergeSearchParameters: true })).toBe(p('/studios/test/stacks?type=all&limit=10'))
    expect(stack.$link({ stackId: 'stk', limit: 10 }, { mergeSearchParameters: true })).toBe(p('/studios/test/stacks/stk'))
    expect(stack.$link({ stackId: 'stk', studioId: 'std' }, { mergeSearchParameters: true })).toBe(p('/studios/std/stacks/stk'))
  }))

  describe('should create links using only new parameters as search parameters', testHash(({ p }) => {
    navigator.currentParams = { studioId: 'test', type: 'own' }
    const stacks = root.studios.studio.stacks as AnyRoute
    const stack = root.studios.studio.stacks.stack as AnyRoute
    expect(stacks.$link({ limit: 10 })).toBe(p('/studios/test/stacks?limit=10'))
    expect(stacks.$link({ studioId: 'another' })).toBe(p('/studios/another/stacks'))
    expect(stacks.$link({ limit: 10, type: 'all' })).toBe(p('/studios/test/stacks?type=all&limit=10'))
    expect(stack.$link({ stackId: 'stk', limit: 10 })).toBe(p('/studios/test/stacks/stk'))
    expect(stack.$link({ stackId: 'stk', studioId: 'std' })).toBe(p('/studios/std/stacks/stk'))
  }))

  it('should serialize search parameters when creating a link', () => {
    const params = {
      boolArr: [true],
      boolF: false,
      boolT: true,
      doubleArr: [[1, 2, 3], [4], [5, 6]],
      num: 10,
      numArr: [1, 2, 3],
      obj: { name: 'Navani Kholin', age: 55 },
      str: 'Hello World',
      strArr: ['hello', 'world', 'hello world', 'hi-welcome'],
    }
    const href = root.testSearchParams.$link(params)
    const parts = href.split('?')[1].split('&')
    expect(parts.length).toBe(14)
    expect(parts).toContain('boolArr=true')
    expect(parts).toContain('boolF=false')
    expect(parts).toContain('boolT=true')
    expect(parts).toContain(`doubleArr=${encodeURIComponent(JSON.stringify(params.doubleArr))}`)
    expect(parts).toContain('num=10')
    expect(parts).toContain('numArr=1')
    expect(parts).toContain('numArr=2')
    expect(parts).toContain('numArr=3')
    expect(parts).toContain(`obj=${encodeURIComponent(JSON.stringify(params.obj)).replace(/%20/g, '+')}`)
    expect(parts).toContain('str=Hello+World')
    expect(parts).toContain('strArr=hello')
    expect(parts).toContain('strArr=world')
    expect(parts).toContain('strArr=hello+world')
    expect(parts).toContain('strArr=hi-welcome')
  })

  describe('should serialize route parameters when creating a link', testHash(({ p }) => {
    const params = {
      boolArr: [true, false],
      boolF: false,
      boolT: true,
      doubleArr: [[1, 2, 3], [4]],
      num: 20,
      numArr: [1],
      obj: { name: 'Navani Kholin', age: 55 },
      str: 'Hello World',
      strArr: ['hello', 'world', 'hello world'],
    }
    const href = root.testRouteParams.$link(params)
    const parts = href.replace(p('/testRouteParams/'), '').split('/')
    expect(parts.length).toBe(9)
    expect(parts[0]).toBe('Hello%20World')
    expect(parts[1]).toBe('20')
    expect(parts[2]).toBe('true')
    expect(parts[3]).toBe('false')
    expect(parts[4]).toBe('hello-world-hello%20world')
    expect(parts[5]).toBe('1')
    expect(parts[6]).toBe('true-false')
    expect(parts[7]).toBe(encodeURIComponent(JSON.stringify(params.obj)))
    expect(parts[8]).toBe(encodeURIComponent(JSON.stringify(params.doubleArr)))
  }))

  it('should escape strings when creating link with an array as a route parameter', () => {
    const href = root.testArrayEscape.$link({ strArr: ['hello', 'hello my world', 'hello-world', 'hi--welcome---test-', ''] })
    const parts = href.split('/')
    expect(parts[parts.length - 1]).toBe('hello-hello%20my%20world-hello%5C-world-hi%5C-%5C-welcome%5C-%5C-%5C-test%5C--')
  })

  it('should call $link while navigating with $go and merge search params (default)', () => {
    const { historyMock, unMockHistory } = mockHistory()
    const ogLink = root.studios.$link
    root.studios.$link = jest.fn(() => '/link-test')
    root.studios.$go({ like: 'search' })
    expect(root.studios.$link).toHaveBeenCalledWith({ like: 'search' }, { mergeSearchParameters: true })
    expect(historyMock.pushState).toHaveBeenCalledWith({}, '', '/link-test')
    root.studios.$link = ogLink
    unMockHistory()
  })

  it('should call $link while navigating with $go without merging search params', () => {
    const { historyMock, unMockHistory } = mockHistory()
    const ogLink = root.studios.$link
    root.studios.$link = jest.fn(() => '/link-test')
    root.studios.$go({ like: 'search' }, { mergeSearchParameters: false })
    expect(root.studios.$link).toHaveBeenCalledWith({ like: 'search' }, { mergeSearchParameters: false })
    expect(historyMock.pushState).toHaveBeenCalledWith({}, '', '/link-test')
    root.studios.$link = ogLink
    unMockHistory()
  })

  describe('should navigate by pushing a route to the navigation history and updating navigator (full route change)', testHash(({ p }) => {
    const { historyMock, unMockHistory } = mockHistory()
    root.studios.studio.$go({ studioId: 'test' })
    expect(historyMock.pushState).toHaveBeenCalledWith({}, '', p('/studios/test'))
    expect(navigator.updateRoute).toHaveBeenCalled()
    unMockHistory()
  }))

  describe(
    'should navigate by replacing a route in the navigation history and updating navigator (route param change)',
    testHash(({ p }) => {
      const { historyMock, unMockHistory } = mockHistory()
      navigator.mockCurrentRoute('/studios/test', root.studios.studio, { studioId: 'test' })
      root.studios.studio.$go({ studioId: 'test2' })
      expect(historyMock.replaceState).toHaveBeenCalledWith({}, '', p('/studios/test2'))
      expect(navigator.updateRoute).toHaveBeenCalled()
      unMockHistory()
    }),
  )

  describe(
    'should navigate by replacing a route in the navigation history and updating navigator (search param change)',
    testHash(({ p }) => {
      const { historyMock, unMockHistory } = mockHistory()
      navigator.mockCurrentRoute('/studios', root.studios)
      root.studios.$go({ limit: 20 })
      expect(historyMock.replaceState).toHaveBeenCalledWith({}, '', p('/studios?limit=20'))
      expect(navigator.updateRoute).toHaveBeenCalled()
      unMockHistory()
    }),
  )

  describe('should force navigation with replaceState', testHash(({ p }) => {
    const { historyMock, unMockHistory } = mockHistory()
    root.studios.studio.$go({ studioId: 'test' }, { replace: true })
    expect(historyMock.replaceState).toHaveBeenCalledWith({}, '', p('/studios/test'))
    unMockHistory()
  }))

  it('should force navigation with pushState', () => {
    testHash(({ p }) => {
      const { historyMock, unMockHistory } = mockHistory()
      navigator.mockCurrentRoute('/studios', root.studios)
      root.studios.$go({ like: 'search' }, { replace: false })
      expect(historyMock.pushState).toHaveBeenCalledWith({}, '', p('/studios?like=search'))
      unMockHistory()
    })
  })

  it('should navigate, but not update the navigator', () => {
    const ogUpdate = navigator.updateRoute
    navigator.updateRoute = jest.fn()
    root.studios.studio.$go({ studioId: 'test' }, { preventDefault: true })
    expect(navigator.updateRoute).not.toHaveBeenCalled()
    navigator.updateRoute = ogUpdate
  })

  it('should check if keys are equal', () => {
    expect(root.$is('root')).toBe(true)
    expect(root.$is('root.studios')).toBe(false)
    expect(root.studios.studio.stacks.$is('root.studios.studio.stacks')).toBe(true)
    expect(root.studios.studio.stacks.$is('root.studios.studio')).toBe(false)
    expect(root.studios.studio.stacks.$is('root.studios.studio.stacks.stack')).toBe(false)
  })

  it('should check if keys are equal or sub-routes', () => {
    expect(root.$containsSubroute('root')).toBe(true)
    expect(root.$containsSubroute('root.studios')).toBe(true)
    expect(root.studios.studio.stacks.$containsSubroute('root.studios.studio.stacks')).toBe(true)
    expect(root.studios.studio.stacks.$containsSubroute('root.studios.studio')).toBe(false)
    expect(root.studios.studio.stacks.$containsSubroute('root.studios.studio.stacks.stack')).toBe(true)
    expect(root.studios.studio.stacks.$containsSubroute('root.studios.studio.stacks.blah')).toBe(true)
    expect(root.studios.studio.stacks.$containsSubroute('root.studios.studio.plugins')).toBe(false)
  })

  it('should check if key is equal or a super-route', () => {
    expect(root.$isSubrouteOf('root')).toBe(true)
    expect(root.$isSubrouteOf('root.studios')).toBe(false)
    expect(root.studios.studio.stacks.$isSubrouteOf('root.studios.studio.stacks')).toBe(true)
    expect(root.studios.studio.stacks.$isSubrouteOf('root.studios.studio')).toBe(true)
    expect(root.studios.studio.stacks.$isSubrouteOf('root.studios')).toBe(true)
    expect(root.studios.studio.stacks.$isSubrouteOf('root')).toBe(true)
    expect(root.studios.studio.stacks.$isSubrouteOf('root.studios.studio.plugins')).toBe(false)
    expect(root.studios.studio.stacks.$isSubrouteOf('root.studios.studio.stacks.stack')).toBe(false)
  })

  it('should match path as exact', () => {
    expect(root.$match('/')).toBe('exact')
    expect(root.studios.$match('/studios')).toBe('exact')
    expect(root.studios.studio.stacks.stack.starters.starter.$match('/studios/std1/stacks/stk1/starters/stt1')).toBe('exact')
  })

  it('should match path with wildcard as exact', () => {
    expect(root.account.$match('/account/credentials/reset-password')).toBe('exact')
  })

  it('should match path as subroute', () => {
    expect(root.$match('/blah')).toBe('subroute')
    expect(root.studios.$match('/studios/studio')).toBe('subroute')
    expect(root.studios.studio.stacks.$match('/studios/std1/stacks/stk1/starters/stt1')).toBe('subroute')
  })

  it('should match path as super-route', () => {
    expect(root.studios.$match('/')).toBe('super-route')
    expect(root.studios.studio.stacks.$match('/studios/studio')).toBe('super-route')
    expect(root.studios.studio.stacks.$match('/studios')).toBe('super-route')
    expect(root.studios.studio.stacks.$match('/')).toBe('super-route')
  })

  it('should identify if active or not', () => {
    expect(root.$isActive()).toBe(true)
    expect(root.studios.$isActive()).toBe(false)
    navigator.mockCurrentRoute('/studios', root.studios)
    expect(root.$isActive()).toBe(false)
    expect(root.studios.$isActive()).toBe(true)
  })

  it('should identify if any sub-route is active or not', () => {
    expect(root.$isSubrouteActive()).toBe(true)
    expect(root.studios.$isSubrouteActive()).toBe(false)
    navigator.mockCurrentRoute('/studios', root.studios)
    expect(root.$isSubrouteActive()).toBe(true)
    expect(root.studios.$isSubrouteActive()).toBe(true)
    navigator.mockCurrentRoute('/studios/studio/stacks/stack', root.studios.studio.stacks.stack, { studioId: 'studio', stackId: 'stack' })
    expect(root.$isSubrouteActive()).toBe(true)
    expect(root.studios.$isSubrouteActive()).toBe(true)
    expect(root.studios.studio.$isSubrouteActive()).toBe(true)
    expect(root.studios.studio.stacks.$isSubrouteActive()).toBe(true)
    expect(root.studios.studio.stacks.stack.$isSubrouteActive()).toBe(true)
    expect(root.studios.studio.stacks.stack.starters.$isSubrouteActive()).toBe(false)
    expect(root.studios.studio.plugins.$isSubrouteActive()).toBe(false)
  })

  it('should get the path from the root of the navigation tree to the route', () => {
    expect(root.$getBranch()).toEqual([root])
    expect(root.studios.$getBranch()).toEqual([root, root.studios])
    expect(root.studios.studio.stacks.stack.starters.starter.$getBranch()).toEqual([
      root,
      root.studios,
      root.studios.studio,
      root.studios.studio.stacks,
      root.studios.studio.stacks.stack,
      root.studios.studio.stacks.stack.starters,
      root.studios.studio.stacks.stack.starters.starter,
    ])
  })
})
