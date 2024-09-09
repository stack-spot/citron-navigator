import { AnyRoute, Route } from './Route'
import { NavigationError, NavigationSetupError } from './errors'
import { removeElementFromArray, splitPath } from './utils'

type NotFoundListener = (path: string) => void
type RouteChangeListener = (route: Route, params: Record<string, any>) => void
type AsyncRouteChangeListener = (route: Route, params: Record<string, any>) => Promise<void> | void

/**
 * Singleton. This is the application's navigator (Citron Navigator).
 * 
 * To create a CitronNavigator instance, call `CitronNavigator.create`. If there's not yet an instance, it will create one, otherwise, it
 * will return the existing instance.
 * 
 * To access the current instance, use `CitronNavigator.instance`, which will be undefined if no instance has been created yet.
 */
export class CitronNavigator {
  private root: AnyRoute
  private notFoundListeners: NotFoundListener[] = []
  private routeChangeListeners: RouteChangeListener[] = []
  private asyncRouteChangeListeners: AsyncRouteChangeListener[] = []
  currentRoute: AnyRoute | undefined
  currentParams: Record<string, any> = {}
  useHash: boolean
  static readonly instance: CitronNavigator | undefined

  private constructor(root: AnyRoute, useHash = true) {
    this.root = root
    this.useHash = useHash
    window.addEventListener('popstate', () => this.updateRoute())
    this.updateRoute()
  }

  /**
   * Creates a navigator if none has been created yet. Otherwise, returns the current navigator.
   * @param root the navigation tree.
   * @param useHash whether or not to use hash-based urls (domain/#/path). The default is true.
   * @returns the navigator
   */
  static create(root: AnyRoute, useHash = true) {
    // @ts-ignore: should be read-only for external code only
    CitronNavigator.instance ??= new CitronNavigator(root, useHash)
    return CitronNavigator.instance
  }

  /**
   * Copies every child route of `source` to `target` if the child route of `source` doesn't exist in `target`.
   * 
   * If a child of `source` exists in `target`, but it's path includes a wildcard (/*), we recursively copy its children to the same route
   * in `target`.
   * @param source the route to have its children copied.
   * @param target the route to copy the children to.
   */
  private copy(source: AnyRoute, target: AnyRoute) {
    Object.keys(source).forEach((key) => {
      const k = key as keyof AnyRoute
      if (!k.startsWith('$') && source[k] instanceof Route) {
        if (!(k in target)) {
          source[k].$parent = target
          target[k] = source[k]
        } else if (source[k].$path.endsWith('/*')) {
          this.copy(source[k], target[k])
        }
      }
    })
  }

  /**
   * Updates the navigation tree by merging a node with another.
   * 
   * This is used by modular navigation. A module can load more routes into the tree.
   * @param route the node to be merged into the tree.
   * @param keyToReplace the key of the node to be merged.
   */
  updateNavigationTree(route: Route<any, any, any>, keyToReplace: string) {
    let oldRoute: any = this.root
    const reminderKey = keyToReplace.replace(new RegExp(`^${this.root.$key}\\.?`), '')
    const keyParts = reminderKey.split('.')
    if (reminderKey) keyParts.forEach(key => oldRoute = oldRoute?.[key])
    if (!oldRoute) {
      throw new NavigationSetupError(
        `Navigation error: cannot update navigation tree at route with key "${keyToReplace}" because the key doesn't exist.`,
      )
    }
    if (oldRoute === this.root) {
      this.root = route
    } else {
      route.$parent = oldRoute.$parent
      oldRoute.$parent[keyParts[keyParts.length - 1]] = route
    }
    // validation: check for route clashes
    const oldPaths = Object.keys(oldRoute).reduce<string[]>((result, key) => {
      if (key.startsWith('$')) return result
      const value = oldRoute[key as keyof typeof oldRoute]
      return !(value instanceof Route) || value.$path.endsWith('/*') ? result : [...result, value.$path]
    }, [])
    Object.keys(route).forEach((key) => {
      const value = route[key as keyof typeof route]
      if (key.startsWith('$') || !(value instanceof Route)) return
      if (oldPaths.includes(value.$path)) {
        throw new NavigationSetupError(
          `Error while merging modular route with key "${keyToReplace}". Path "${value.$path}" is already defined in parent. Only paths with wildcard can be replaced.`,
        )
      }
      if (key in oldRoute && oldRoute[key] instanceof Route && !oldRoute[key].$path.endsWith('/*')) {
        throw new NavigationSetupError(
          `Error while merging modular route, key "${keyToReplace}" is already defined in parent with a non-wildcard path.`,
        )
      }
    })
    
    this.copy(oldRoute, route)
    this.updateRoute()
  }

  /**
   * Gets the path of the provided url (considering hash-based paths).
   * 
   * Examples:
   * - "https://www.stackspot.com/pt/ai-assistente" (useHash = false): "pt/ai-assistente".
   * - "https://www.stackspot.com/#/pt/ai-assistente" (useHash = true): "pt/ai-assistente".
   * 
   * @param url the url to extract the path from. The current url (window.location) is used if none is provided. 
   * @returns the path part of the url.
   */
  getPath(url: URL = new URL(location.toString())) {
    return this.useHash ? url.hash.replace(/^\/?#\/?/, '').replace(/\?.*/, '') : url.pathname.replace(/^\//, '')
  }

  /**
   * Updates the current route according to the current URL.
   */
  async updateRoute() {
    const route = this.findRouteByPath(this.root, this.getPath())
    if (route) await this.handleRouteChange(route)
    else this.handleNotFound()
  }

  private childrenOf(route: Record<string, any>): Route[] {
    return Object.keys(route).reduce<Route[]>((result, key) => {
      if (!key.startsWith('$')) result.push(route[key])
      return result
    }, [])
  }

  private findRouteByPath(route: Route, path: string, lastMatch?: Route): Route | undefined {
    switch (route.$match(path)) {
      case 'exact':
        return route.$path.endsWith('*')
          ? this.childrenOf(route).reduce<Route | undefined>(
            (result, child) => result ?? this.findRouteByPath(child, path, route),
            undefined,
          ) ?? route
          : route
      case 'subroute':
        return this.childrenOf(route).reduce<Route | undefined>(
          (result, child) => result ?? this.findRouteByPath(child, path),
          undefined,
        ) ?? (route.$path.endsWith('*') ? route : lastMatch)
    }
  }

  private async handleRouteChange(route: Route) {
    this.currentRoute = route
    const url = new URL(location.toString())
    this.currentParams = { ...this.extractQueryParams(url), ...this.extractUrlParams(url) }
    await Promise.all(this.asyncRouteChangeListeners.map(l => l(route, this.currentParams)))
    this.routeChangeListeners.forEach(l => l(route, this.currentParams))
  }

  private handleNotFound() {
    const path = this.getPath()
    // eslint-disable-next-line no-console
    console.error(new NavigationError(`route not registered (${path})`).message)
    this.notFoundListeners.forEach(l => l(path))
  }

  private paramTypeError(key: string, value: string, type: string, routeKey: string, interpretingAs: string = 'a raw string') {
    return new NavigationError(
      `error while deserializing parameter "${key}" of route "${routeKey}". The value ("${value}") is not a valid ${type}. Citron Navigator will interpret it as ${interpretingAs}, which may cause issues ahead.`,
    ).message
  }

  private deserializeNumber(key: string, value: string) {
    const deserialized = parseFloat(value)
    // eslint-disable-next-line no-console
    if (isNaN(deserialized)) console.error(this.paramTypeError(key, value, 'number', this.currentRoute?.$key ?? 'unknown', 'NaN'))
    return deserialized
  }

  private deserializeBoolean(key: string, value: string) {
    if (value === 'true' || value === '') return true
    if (value === 'false') return false
    // eslint-disable-next-line no-console
    console.error(this.paramTypeError(key, value, 'boolean', this.currentRoute?.$key ?? 'unknown', 'true'))
    return true
  }

  private deserializeParameter(key: string, values: string[]): any {
    const value = values[0]
    if (!this.currentRoute) return value
    const type = this.currentRoute.$paramMetadata[key]
    switch (type) {
      case 'string': return value
      case 'number': return this.deserializeNumber(key, value)
      case 'boolean': return this.deserializeBoolean(key, value)
      case 'string[]': return values
      case 'number[]': return values.map(v => this.deserializeNumber(key, v))
      case 'boolean[]': return values.map(v => this.deserializeBoolean(key, v))
      case 'object':
        try {
          return JSON.parse(value)
        } catch {
          // eslint-disable-next-line no-console
          console.error(this.paramTypeError(key, value, type, this.currentRoute.$key))
          return value
        }
    }
  }

  private extractQueryParams(url: URL) {
    const params = this.useHash ? new URLSearchParams(url.hash.replace(/[^?]*\??/, '')) : url.searchParams
    const result: Record<string, any> = {}
    params.forEach((_, name) => {
      if (name in result) return
      result[name] = this.deserializeParameter(name, params.getAll(name))
    })
    return result
  }

  private extractUrlParams(url: URL) {
    const result: Record<string, any> = {}
    const routeParts = splitPath(this.currentRoute?.$path)
    const urlParts = splitPath(this.getPath(url))
    const paramMetadata = this.currentRoute?.$paramMetadata ?? {}
    routeParts.forEach((value, index) => {
      const [, key] = value.match(/\{(\w+)\}/) ?? []
      const paramStringValue = decodeURIComponent(urlParts[index])
      /* if the parameter is supposed to be an array, get all of its values by splitting the string by "-" (considering "\" as a escape
      character). */
      const paramArrayValue = paramMetadata[key]?.endsWith('[]')
        ? paramStringValue.split(/(?<!\\)-/).map(item => item.replace(/\\-/g, '-'))
        : [paramStringValue]
      if (key) result[key] = this.deserializeParameter(key, paramArrayValue)
    })
    return result
  }

  private addRouteChangeListener(listener: AsyncRouteChangeListener, isAsync: boolean): () => void {
    const list = isAsync ? this.asyncRouteChangeListeners : this.routeChangeListeners
    list.push(listener)
    if (this.currentRoute) listener(this.currentRoute, this.currentParams)
    return () => {
      removeElementFromArray(list, listener)
    }
  }

  /**
   * Adds a listener for changes to the route.
   * 
   * If you need a listener that runs asynchronously, consider using `onRouteChangeAsync`.
   * @param listener a function called when the route changes.
   * @returns a function that, when called, removes the listener.
   */
  onRouteChange(listener: RouteChangeListener): () => void {
    return this.addRouteChangeListener(listener, false)
  }

  /**
   * Adds a listener for changes to the route. This listener can be async (return a promise).
   * 
   * Asynchronous listeners are run before every synchronous listener. Synchronous listeners are only run once all async listeners finish
   * running.
   * @param listener a function called when the route changes.
   * @returns a function that, when called, removes the listener.
   */
  onRouteChangeAsync(listener: AsyncRouteChangeListener): () => void {
    return this.addRouteChangeListener(listener, true)
  }

  /**
   * Adds a listener that runs when a navigation is performed to a route that doesn't exist.
   * 
   * @param listener a function called when the route is not found.
   * @returns a function that, when called, removes the listener.
   */
  onNotFound(listener: NotFoundListener): () => void {
    this.notFoundListeners.push(listener)
    return () => {
      removeElementFromArray(this.notFoundListeners, listener)
    }
  }
}
