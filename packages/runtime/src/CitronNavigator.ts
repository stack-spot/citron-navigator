import { Route } from './Route'
import { NavigationError } from './errors'
import { removeElementFromArray, splitPath } from './utils'

type NotFoundListener = (path: string) => void
type RouteChangeListener = (route: Route, params: Record<string, any>) => void

export class CitronNavigator {
  private root: Route
  private notFoundListeners: NotFoundListener[] = []
  private routeChangeListeners: RouteChangeListener[] = []
  currentRoute: Route
  currentParams: Record<string, any> = {}
  useHash: boolean
  static readonly instance: CitronNavigator

  constructor(root: Route, useHash = true) {
    // @ts-ignore
    CitronNavigator.instance = this
    this.root = root
    this.currentRoute = root
    this.useHash = useHash
    window.addEventListener('popstate', () => this.locationHandler())
    this.locationHandler()
  }

  getPath(url: URL = new URL(location.toString())) {
    return this.useHash ? url.hash.replace(/^\/?#\/?/, '').replace(/\?.*/, '') : url.pathname
  }

  private locationHandler() {
    const route = this.findRouteByPath(this.root, this.getPath())
    if (route) this.handleRouteChange(route)
    else this.handleNotFound()
  }

  private childrenOf(route: Record<string, any>): Route[] {
    return Object.keys(route).reduce<Route[]>((result, key) => {
      if (!key.startsWith('$')) result.push(route[key])
      return result
    }, [])
  }

  private findRouteByPath(route: Route, path: string): Route | undefined {
    switch (route.$match(path)) {
      case 'exact': return route
      case 'subroute':
        return this.childrenOf(route).reduce<Route | undefined>(
          (result, child) => result ?? this.findRouteByPath(child, path),
          undefined,
        )
    }
  }

  private handleRouteChange(route: Route) {
    this.currentRoute = route
    const url = new URL(location.toString())
    this.currentParams = { ...this.extractQueryParams(url), ...this.extractUrlParams(url) }
    this.routeChangeListeners.forEach(l => l(route, this.currentParams))
  }

  private handleNotFound() {
    // eslint-disable-next-line no-console
    console.error(new NavigationError(`route not registered (${location.pathname})`).message)
    this.notFoundListeners.forEach(l => l(location.pathname))
  }

  private paramTypeError(key: string, value: string, type: string, routeKey: string, interpretingAs: string = 'a raw string') {
    return new NavigationError(
      `error while deserializing parameter "${key}" of route "${routeKey}". The value ("${value}") is not a valid ${type}. Citron Navigator will interpret it as ${interpretingAs}, which may cause issues ahead.`,
    ).message
  }

  private deserializeUrlParam(key: string, value: string): any {
    if (!this.currentRoute) return value
    const type = this.currentRoute.$paramMetadata[key]
    switch (type) {
      case 'string': return value
      case 'number':
        try {
          return value.includes('.') ? parseFloat(value) : parseInt(value)
        } catch {
          // eslint-disable-next-line no-console
          console.error(this.paramTypeError(key, value, type, this.currentRoute.$key))
          return value
        }
      case 'boolean':
        if (value === 'true' || value === '') return true
        if (value === 'false') return false
        // eslint-disable-next-line no-console
        console.error(this.paramTypeError(key, value, type, this.currentRoute.$key, 'true'))
        return true
      case 'array':
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) return parsed
          // eslint-disable-next-line no-console
          console.error(this.paramTypeError(key, value, type, this.currentRoute.$key))
          return value
        } catch {
          // eslint-disable-next-line no-console
          console.error(this.paramTypeError(key, value, type, this.currentRoute.$key))
          return value
        }
      case 'object':
        try {
          const parsed = JSON.parse(value)
          if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
          // eslint-disable-next-line no-console
          console.error(this.paramTypeError(key, value, type, this.currentRoute.$key))
          return value
        } catch {
          // eslint-disable-next-line no-console
          console.error(this.paramTypeError(key, value, type, this.currentRoute.$key))
          return value
        }
      default:
        // eslint-disable-next-line no-console
        console.warn(`Navigation: extra parameter found for route "${this.currentRoute.$key}": "${key}". The navigator will interpret it as a string.`)
        return value
    }
  }

  private extractQueryParams(url: URL) {
    const params = this.useHash ? new URLSearchParams(url.hash.replace(/[^?]*\??/, '')) : url.searchParams
    const result: Record<string, any> = {}
    params.forEach((value, key) => {
      result[key] = this.deserializeUrlParam(key, value)
    })
    return result
  }

  private extractUrlParams(url: URL) {
    const result: Record<string, any> = {}
    const routeParts = splitPath(this.currentRoute?.$path)
    const urlParts = splitPath(this.getPath(url))
    routeParts.forEach((value, index) => {
      const [, key] = value.match(/\{(\w+)\}/) ?? []
      if (key) result[key] = this.deserializeUrlParam(key, urlParts[index])
    })
    return result
  }

  onRouteChange(listener: RouteChangeListener): () => void {
    this.routeChangeListeners.push(listener)
    listener(this.currentRoute, this.currentParams)
    return () => {
      removeElementFromArray(this.routeChangeListeners, listener)
    }
  }

  onNotFound(listener: NotFoundListener): () => void {
    this.notFoundListeners.push(listener)
    return () => {
      removeElementFromArray(this.notFoundListeners, listener)
    }
  }
}
