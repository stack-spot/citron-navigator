import { CitronNavigator } from './CitronNavigator'
import { splitPath } from './utils'

type ParamType = 'string' | 'number' | 'boolean' | 'string[]' | 'number[]' | 'boolean[]' | 'object'

interface LinkOptions {
  /**
   * Whether or not to merge the provided search parameters with the current search parameters.
   * @default false
   */
  mergeSearchParameters?: boolean,
}

interface GoOptions {
  /**
   * Whether or not to merge the provided search parameters with the current search parameters.
   * @default true
   */
  mergeSearchParameters?: boolean,
  /**
   * True to navigate with `history.replaceState`. False to navigate with `history.pushState`.
   * 
   * When `replace` is undefined, this option will be calculated:
   * - true if the outgoing route is the same as the current route, i.e. if the only change is to the parameters of the route and not to the
   * route itself.
   * - false otherwise.
   */
  replace?: boolean,
  /**
   * If true, prevents any navigation event from firing. i.e. the URL will change, but nothing else will.
   * 
   * You can fire a navigation event manually by calling `CitronNavigator.instance?.updateRoute()`.
   * @default false
   */
  preventDefault?: boolean,
}

/**
 * Any Route of the Citron Navigator.
 */
export type AnyRoute = Route<any, any, any>

/**
 * A Route of the Citron Navigator. The root route, i.e. the route that has no parent will be the Navigation Tree.
 * 
 * Routes are equal if they have the same key. To test route equality, use `routeA.equals(routeB)`, do not use same-value-zero equality
 * (`routeA === routeB`).
 * 
 * Every property of this class not prefixed with "$" is a child route.
 */
export abstract class Route<
  Parent extends Route<any, any> | undefined = Route<any, any>,
  Params extends Record<string, any> | void = Record<string, any>,
  RouteKey extends string = string,
> {
  /**
   * A unique key that identifies this route.
   * 
   * This will be in the format "a.b.c", where each name separated by "." is the name of a route in the navigation tree, "a" is the root
   * node's name and "c" is this route's name.
   */
  $key: string
  /**
   * The path to this route. Variables are represented as `{variable_name}`.
   */
  $path: string
  /**
   * The Route that is the parent of this route in the navigation tree.
   */
  $parent: Parent
  /**
   * The parameters this route can have and their types.
   */
  $paramMetadata: Record<string, ParamType>

  constructor(key: string, path: string, parent: Parent, paramMetadata: Record<string, ParamType>) {
    this.$key = key
    this.$path = path
    this.$parent = parent
    this.$paramMetadata = paramMetadata
  }

  /**
   * Navigates to this route using the browser's history API. This can be either a page change or just a modification to a route parameter.
   * 
   * To control whether to use history.pushState or history.replaceState, pass "replace" in the options parameter.
   * 
   * By default, whenever the current route is the same as the route we're navigating to, `history.replaceState` is used. Otherwise,
   * `history.pushState` is.
   * 
   * The parameters provided are merged with the parameters of the current URL. To avoid merging unwanted search parameters, pass the option
   * `mergeSearchParameters: false`.
   * @param params the parameters for the route.
   * @param options optional. The options for this navigation.
   */
  $go(params: Record<string, never> extends Params ? void | Params : Params, options?: GoOptions) {
    const replace = options?.replace ?? this.$isActive()
    const operation = replace ? 'replaceState' : 'pushState'
    history[operation]({}, '', this.$link(params, { mergeSearchParameters: options?.mergeSearchParameters ?? true }))
    if (!options?.preventDefault) CitronNavigator.instance?.updateRoute()
  }

  private setSearchParam(searchParams: URLSearchParams, key: string, value: any) {
    if (value === undefined || value === null || value === '') return
    const type = this.$paramMetadata[key]
    if (type.endsWith('[]') && Array.isArray(value)) return value.forEach(v => searchParams.append(key, v))
    searchParams.set(key, type === 'object' ? JSON.stringify(value) : value)
  }

  /**
   * Creates a link (relative url) to this route.
   * 
   * When creating a link, the provided search parameters are not merged with the current search parameters. To allow than to merge, pass
   * `mergeSearchParameters: true` in the options (2nd parameter).
   * @param params the parameters for the route.
   * @param options optional. The options for creating the link.
   * @returns the relative url to this route.
   */
  $link(params: Record<string, never> extends Params ? void | Params : Params, options?: LinkOptions): string {
    const parameters: Record<string, any> = { ...CitronNavigator.instance?.currentParams, ...params }
    const urlParams: string[] = []
    const path = this.$path.replace(/\/\*$/, '').replace(/\{(\w+)\}/g, (_, match) => {
      urlParams.push(match)
      const type = this.$paramMetadata[match]
      const value = parameters[match]
      let serialized = `${value}`
      if (type.endsWith('[]') && Array.isArray(value)) {
        serialized = value.map(item => typeof item === 'string' ? item.replace(/-/g, '\\-') : item).join('-')
      }
      else if (type === 'object') serialized = JSON.stringify(value)
      return encodeURIComponent(serialized)
    })
    const url = new URL(CitronNavigator.instance?.useHash ? location.pathname : path, location.origin)
    if (CitronNavigator.instance?.useHash) url.hash = `#${path}`
    const newSearchParams = (options?.mergeSearchParameters ? parameters : params) ?? {}
    Object.keys(this.$paramMetadata).forEach(
      key => !urlParams.includes(key) && this.setSearchParam(url.searchParams, key, newSearchParams[key]),
    )
    return `${url.pathname}${url.hash}${url.search}`
  }

  /**
   * Checks if the key passed as parameter corresponds to this route.
   * @param key the key to compare.
   * @returns true if the key is the same as this route's key. False otherwise.
   */
  $is(key: RouteKey): boolean {
    return this.$key === key
  }

  /**
   * Checks if the route passed as parameter is equivalent to the this route.
   * @param route the route to compare.
   * @returns true if it's  equivalent, false otherwise.
   */
  $equals(route: AnyRoute) {
    return this.$key === route.$key
  }

  /**
   * Checks if the key passed as parameter corresponds to this route or a sub-route of this route.
   * 
   * Attention: this will only check the format of the key. It won't verify if the route actually exists.
   * 
   * @param key the key to compare.
   * @returns true if the key is a sub-route (or equal). False otherwise.
   */
  $containsSubroute(key: RouteKey): boolean {
    return this.$key === key || key.startsWith(`${this.$key}.`)
  }

  /**
   * Checks if this route corresponds to the key passed as parameter or any sub-route of the key.
   * 
   * @param key the key to compare.
   * @returns true if this is a sub-route of the key (or equal). False otherwise.
   */
  $isSubrouteOf(key: RouteKey): boolean {
    return this.$key === key || this.$key.startsWith(`${key}.`)
  }

  /**
   * Checks how the path passed as parameter matches this route.
   * 
   * Attention: this won't verify if the path corresponds to an actual route. It will make a decision only based in the path's format.
   * 
   * @param path the path to test this route against
   * @returns
   * - `no-match` if this route and the path passed as parameter are not related.
   * - `exact` if the path passed as parameter corresponds to this route; wildcards will always match as exact.
   * - `subroute` if the path passed as parameter corresponds to a sub-route (descendent) of this route.
   * - `super-route` if the path passed as parameter corresponds to a super-route (ascendent) of this route.
   */
  $match(path: string): 'no-match' | 'exact' | 'subroute' | 'super-route' {
    const thatPathParts = splitPath(path)
    const thisPathParts = splitPath(this.$path.replace(/\/\*$/, ''))
    const min = Math.min(thisPathParts.length, thatPathParts.length)
    for (let i = 0; i < min; i++) {
      const isUrlParam = !!thisPathParts[i].match(/\{\w+\}/)
      if (!isUrlParam && thatPathParts[i] !== thisPathParts[i]) return 'no-match'
    }
    const isWildcard = this.$path.endsWith('/*')
    if (!isWildcard && thisPathParts.length < thatPathParts.length) return 'subroute'
    if (thisPathParts.length > thatPathParts.length) return 'super-route'
    return 'exact'
  }

  /**
   * Checks if this route is currently active.
   * @returns true if this route is the currently active, false otherwise.
   */
  $isActive(): boolean {
    const path = CitronNavigator.instance?.getPath()
    return path !== undefined && this.$match(path) === 'exact'
  }

  /**
   * Checks if this route or any of its sub-route is currently active.
   * @returns true if this route or any of its sub-routes is the currently active, false otherwise.
   */
  $isSubrouteActive(): boolean {
    const path = CitronNavigator.instance?.getPath()
    if (!path) return false
    const match = this.$match(path)
    return path !== undefined && (match === 'subroute' || match === 'exact')
  }

  /**
   * Returns the branch that starts at the root node and ends in this route.
   * @returns an array of routes where the first is the root node and the last is this route.
   */
  $getBranch() {
    const branch: AnyRoute[] = [this]
    while (branch[branch.length - 1].$parent) {
      branch.push(branch[branch.length - 1].$parent)
    }
    return branch.reverse()
  }
}
