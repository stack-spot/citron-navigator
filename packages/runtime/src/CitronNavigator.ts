import { AnyRoute, Route } from './Route'
import { NavigationError } from './errors'
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
  static readonly instance: CitronNavigator

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
   * Updates the navigation tree by replacing a node for another.
   * 
   * This is used by modular navigation. A module can load more routes into the tree.
   * @param route the node to enter the tree.
   * @param keyToReplace the key of the node to be replaces.
   */
  updateNavigationTree(route: Route<any, any, any>, keyToReplace: string) {
    let oldRoute: any = this.root
    const reminderKey = keyToReplace.replace(new RegExp(`^${this.root.$key}\\.?`), '')
    const keyParts = reminderKey.split('.')
    if (reminderKey) keyParts.forEach(key => oldRoute = oldRoute?.[key])
    if (!oldRoute) {
      throw new Error(`Navigation error: cannot update navigation tree at route with key "${keyToReplace}" because the key doesn't exist.`)
    }
    if (oldRoute === this.root) {
      this.root = route
    } else {
      route.$parent = oldRoute.$parent
      oldRoute.$parent[keyParts[keyParts.length - 1]] = route
    }
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
  updateRoute() {
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
        ) ?? (route.$path.endsWith('*') ? route : undefined)
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
    // eslint-disable-next-line no-console
    console.error(new NavigationError(`route not registered (${location.pathname})`).message)
    this.notFoundListeners.forEach(l => l(location.pathname))
  }

  private paramTypeError(key: string, value: string, type: string, routeKey: string, interpretingAs: string = 'a raw string') {
    return new NavigationError(
      `error while deserializing parameter "${key}" of route "${routeKey}". The value ("${value}") is not a valid ${type}. Citron Navigator will interpret it as ${interpretingAs}, which may cause issues ahead.`,
    ).message
  }

  private deserializeUrlParam(key: string, values: string[]): any {
    const value = values[0]
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
      case 'array': return values
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
      result[name] = this.deserializeUrlParam(name, params.getAll(name))
    })
    return result
  }

  private extractUrlParams(url: URL) {
    const result: Record<string, any> = {}
    const routeParts = splitPath(this.currentRoute?.$path)
    const urlParts = splitPath(this.getPath(url))
    routeParts.forEach((value, index) => {
      const [, key] = value.match(/\{(\w+)\}/) ?? []
      if (key) result[key] = this.deserializeUrlParam(key, [decodeURIComponent(urlParts[index])])
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
