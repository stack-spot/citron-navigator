/* eslint-disable @typescript-eslint/no-unused-vars */

import { CitronNavigator } from '../src/CitronNavigator'
import { AnyRoute } from '../src/Route'

export const navigatorMock = jest.mock

export class NavigatorMock {
  currentRoute: AnyRoute
  currentParams: Record<string, any> = {}
  useHash = true
  private pathMock = '/'
  root: AnyRoute
  updateNavigationTree = jest.fn()
  updateRoute = jest.fn()
  onRouteChange = jest.fn()
  onRouteChangeAsync = jest.fn()
  onNotFound = jest.fn()
  getPath = jest.fn(() => this.pathMock)

  constructor(root: AnyRoute) {
    this.root = root
    this.currentRoute = root
    // @ts-ignore
    CitronNavigator.instance = this
  }
  
  unMock() {
    // @ts-ignore
    CitronNavigator.instance = undefined
  }

  mockCurrentRoute(path: string, route: AnyRoute, params: Record<string, any> = {}) {
    this.pathMock = path
    this.currentRoute = route
    this.currentParams = params
  }

  reset() {
    this.mockCurrentRoute('/', this.root)
    this.updateNavigationTree.mockClear()
    this.updateRoute.mockClear()
    this.onRouteChange.mockClear()
    this.onRouteChangeAsync.mockClear()
    this.onNotFound.mockClear()
    this.getPath.mockClear()
  }
}
