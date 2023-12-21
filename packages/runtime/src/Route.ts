import { CitronNavigator } from './CitronNavigator'
import { RouteParamError } from './errors'
import { splitPath } from './utils'

type ParamType = 'string' | 'number' | 'boolean' | 'array' | 'object'

export abstract class Route<
  Parent extends Route<any, any> | undefined = Route<any, any>,
  Params extends Record<string, any> | void = Record<string, any>,
  RouteKey extends string = string,
> {
  $key: string
  $path: string
  $parent: Parent
  /**
   * Represents the parameters this route can have and their types.
   */
  $paramMetadata: Record<string, ParamType>

  constructor(key: string, path: string, parent: Parent, paramMetadata: Record<string, ParamType>) {
    this.$key = key
    this.$path = path
    this.$parent = parent
    this.$paramMetadata = paramMetadata
  }

  $go(params: Record<string, never> extends Params ? void | Params : Params) {
    history.pushState({}, '', this.$link(params))
  }

  $link(params: Record<string, never> extends Params ? void | Params : Params): string {
    const parameters: Record<string, any> = { ...CitronNavigator.instance?.currentParams, ...params }
    const urlParams: string[] = []
    const path = this.$path.replace(/\{(\w+)\}/g, (_, match) => {
      if (!(match in parameters)) throw new RouteParamError(this, match)
      urlParams.push(match)
      return parameters[match]
    })
    const url = new URL(CitronNavigator.instance?.useHash ? location.pathname : path, location.origin)
    if (CitronNavigator.instance?.useHash) url.hash = `#${path}`
    Object.keys(this.$paramMetadata).forEach((key) => {
      if (urlParams.includes(key)) return
      const value = parameters[key]
      if (value !== undefined && value !== null) {
        const serialized = typeof value === 'object' ? JSON.stringify(value) : value
        url.searchParams.set(key, serialized)
      }
    })
    return `${url.pathname}${url.hash}${url.search}`
  }

  $is(key: RouteKey): boolean {
    return this.$key === key
  }

  $containsSubroute(key: RouteKey): boolean {
    return this.$key === key || key.startsWith(`${this.$key}.`)
  }

  $isSubrouteOf(key: RouteKey): boolean {
    return this.$key === key || this.$key.startsWith(`${key}.`)
  }

  /**
   * @param path the path to test this route against
   * @returns
   * - `no-match` if this route and the path passed as parameter are not related;
   * - `exact` if the path passed as parameter corresponds to this route;
   * - `subroute` if the path passed as parameter corresponds to a subroute of this route;
   * - `super-route` if the path passed as parameter corresponds to a super-route of this route.
   */
  $match(path: string): 'no-match' | 'exact' | 'subroute' | 'super-route' {
    const thatPathParts = splitPath(path)
    const thisPathParts = splitPath(this.$path)
    const min = Math.min(thisPathParts.length, thatPathParts.length)
    for (let i = 0; i < min; i++) {
      const isUrlParam = !!thisPathParts[i].match(/\{\w+\}/)
      if (!isUrlParam && thatPathParts[i] !== thisPathParts[i]) return 'no-match'
    }
    if (thisPathParts.length < thatPathParts.length) return 'subroute'
    if (thisPathParts.length > thatPathParts.length) return 'super-route'
    return 'exact'
  }

  $isActive(): boolean {
    const path = CitronNavigator.instance?.getPath()
    return path !== undefined && this.$match(path) === 'exact'
  }

  $isSubrouteActive(): boolean {
    const path = CitronNavigator.instance?.getPath()
    const match = this.$match(path)
    return path !== undefined && (match === 'subroute' || match === 'exact')
  }
}
