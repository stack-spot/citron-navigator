import { CitronNavigator } from '../src/CitronNavigator'
import { AccountRoute, AlternativeRootRoute, ExtendedAccountRoute, RootRoute, SettingsRoute, StudiosRoute, WorkspacesRoute } from './routes'
import { expectToFail, mockLocation } from './utils'

describe('Citron Navigator', () => {
  beforeEach(() => {
    // @ts-ignore
    CitronNavigator.instance = undefined
    window.addEventListener = jest.fn()
    mockLocation('https://www.stackspot.com')
  })

  it('should create new instance and retrieve it when called a second time', () => {
    expect(CitronNavigator.instance).toBeUndefined()
    const navigator = CitronNavigator.create(new RootRoute())
    expect(navigator).toBeInstanceOf(CitronNavigator)
    expect(CitronNavigator.instance).toBe(navigator)
    expect(CitronNavigator.create(new RootRoute())).toBe(navigator)
  })

  it('should observe url changes once instantiated', () => {
    CitronNavigator.create(new RootRoute())
    expect(window.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function))
  })

  it('should update navigation tree (replacing a branch)', () => {
    const navigator = CitronNavigator.create(new RootRoute())
    const root = (navigator as any).root
    expect(root.account.settings).toBeUndefined()
    navigator.updateNavigationTree(new ExtendedAccountRoute(), 'root.account')
    expect(root.account).not.toBeInstanceOf(AccountRoute)
    expect(root.account).toBeInstanceOf(ExtendedAccountRoute)
    expect(root.account.settings).toBeInstanceOf(SettingsRoute)
    expect(root.studios).toBeInstanceOf(StudiosRoute)
  })

  it('should update navigation tree (replacing the root)', () => {
    const navigator = CitronNavigator.create(new RootRoute())
    let root = (navigator as any).root
    expect(root.workspaces).toBeUndefined()
    navigator.updateNavigationTree(new AlternativeRootRoute(), 'root')
    root = (navigator as any).root
    expect(root).not.toBeInstanceOf(RootRoute)
    expect(root).toBeInstanceOf(AlternativeRootRoute)
    expect(root.workspaces).toBeInstanceOf(WorkspacesRoute)
    expect(root.account).toBeUndefined()
    expect(root.studios).toBeUndefined()
  })

  it("should fail to update navigation tree if anchor doesn't exist", () => {
    const navigator = CitronNavigator.create(new RootRoute())
    try {
      navigator.updateNavigationTree(new ExtendedAccountRoute(), 'root.inexistent')
      expectToFail()
    } catch (error: any) {
      expect(error.message).toMatch(/^Navigation error:/)
    }
  })

  it('should compute the path of a url using slash-based paths (domain/path)', () => {
    const navigator = CitronNavigator.create(new RootRoute(), false)
    const path = navigator.getPath(new URL('https://www.stackspot.com/pt/ai-assistente'))
    expect(path).toBe('pt/ai-assistente')
  })

  it('should compute the path of a url using hash-based paths (domain/#/path)', () => {
    const navigator = CitronNavigator.create(new RootRoute())
    const path = navigator.getPath(new URL('https://www.stackspot.com/#/pt/ai-assistente'))
    expect(path).toBe('pt/ai-assistente')
  })

  it('should update the current route as the url changes (useHash = true)', () => {
    // root
    const root = new RootRoute()
    const navigator = CitronNavigator.create(root)
    expect(navigator.currentRoute).toBe(root)
    expect(navigator.currentParams).toEqual({})
    // account (wildcard)
    mockLocation('https://www.stackspot.com/#/account/a/b/test')
    navigator.updateRoute()
    expect(navigator.currentRoute).toBe(root.account)
    expect(navigator.currentParams).toEqual({})
    mockLocation('https://www.stackspot.com/#/studios?like=test&limit=20')
    navigator.updateRoute()
    expect(navigator.currentRoute).toBe(root.studios)
    expect(navigator.currentParams).toEqual({ like: 'test', limit: 20 })
    mockLocation('https://www.stackspot.com/#/studios/studio1/stacks/stack1/starters/starter1?str=test')
    navigator.updateRoute()
    expect(navigator.currentRoute).toBe(root.studios.studio.stacks.stack.starters.starter)
    expect(navigator.currentParams).toEqual({ studioId: 'studio1', stackId: 'stack1', starterId: 'starter1', str: 'test' })
  })

  it('should update the current route as the url changes (useHash = false)', () => {
    // root
    const root = new RootRoute()
    const navigator = CitronNavigator.create(root, false)
    expect(navigator.currentRoute).toBe(root)
    expect(navigator.currentParams).toEqual({})
    // account (wildcard)
    mockLocation('https://www.stackspot.com/account/a/b/test')
    navigator.updateRoute()
    expect(navigator.currentRoute).toBe(root.account)
    expect(navigator.currentParams).toEqual({})
    mockLocation('https://www.stackspot.com/studios?like=test&limit=20')
    navigator.updateRoute()
    expect(navigator.currentRoute).toBe(root.studios)
    expect(navigator.currentParams).toEqual({ like: 'test', limit: 20 })
    mockLocation('https://www.stackspot.com/studios/studio1/stacks/stack1/starters/starter1?str=test')
    navigator.updateRoute()
    expect(navigator.currentRoute).toBe(root.studios.studio.stacks.stack.starters.starter)
    expect(navigator.currentParams).toEqual({ studioId: 'studio1', stackId: 'stack1', starterId: 'starter1', str: 'test' })
  })

  it('should deserialize route parameters', () => {
    
  })

  it('should deserialize search parameters', () => {
    const query = [
      { name: 'str', value: 'Hello World' },
      { name: 'num', value: '42' },
      { name: 'boolT', value: 'true' },
      { name: 'boolT2', value: '' },
      { name: 'boolT3', value: 'blah' },
      { name: 'boolF', value: 'false' },
      { name: 'obj', value: '{"name":"Dalinar Kholin","age":"53","type":"Bondsmith"}' },
      { name: 'arr', value: '1' },
      { name: 'arr', value: '2' },
      { name: 'arr', value: '3' },
      { name: 'doubleArr', value: '[[1,2,3],[4],[5,6,7]]' },
    ]
    const queryString = query.map(({ name, value }) => `${name}=${encodeURIComponent(value)}`).join('&')
    mockLocation(`https://www.stackspot.com/#/testSearchParams?${queryString}`)
    const navigator = CitronNavigator.create(new RootRoute())
    expect(navigator.currentParams).toEqual({
      str: 'Hello World',
      num: 42,
      boolT: true,
      boolT2: true,
      boolT3: true,
      boolF: false,
      obj: { name: 'Dalinar Kholin', age: '53', type: 'Bondsmith' },
      arr: ['1', '2', '3'],
      doubleArr: [[1, 2, 3], [4], [5, 6, 7]],
    })
  })

  it('should not deserialize parameters that are not in the metadata', () => {
    
  })

  it('should deserialize parameters of invalid types as strings and log the error', () => {
    
  })

  it('should manage route change listener', () => {

  })

  it('should manage async route change listener', () => {

  })

  it('async route change listeners should run at once and finish before synchronous listeners start', () => {

  })

  it('should manage route not found listener', () => {

  })
})
