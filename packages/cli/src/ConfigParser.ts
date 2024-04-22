import { parse } from 'yaml'
import { VALID_TYPES } from './constants'
import { DuplicatedRouteError, InvalidModifier, InvalidParameterType, InvalidPath, InvalidRouteFormat, InvalidRouteLinkLevel, InvalidRouteParamName, InvalidSearchParamFormat, InvalidSearchParamName, InvalidYaml, InvalidYamlKeyType, NoRootError, SearchParamClashWithPropagatedParamError, SearchParamClashWithRouteParamError } from './error'
import { Config, JSType, Parameter, PathObject, RouteConfig } from './types'

interface Pair {
  key: string,
  value: any,
}

const PARAM_NAME_REGEX = /^[A-z_]\w*$/
const MODULAR_ROUTE_REGEX = /^\+ (\w+) ~ (\w+(?:\.\w+)*) \(([^)]+)\)\s*$/ // + name ~ reference (path)

export class ConfigParser {
  private config: string
  private routeKeys: string[] = []

  constructor(config: string) {
    this.config = config
  }

  private parseParameter({ key, value }: Pair): Parameter {
    if (typeof value !== 'string') throw new InvalidYamlKeyType(key)
    // regex: modifier? name: jsType (tsType)?
    const [, modifier, name] = key.match(/^(?:(\w+)\s+)?(\w+)$/) ?? []
    const [, jsType, tsType] = value.match(/^([^\s]+)(?:\s+\((.+)\))?$/) ?? []
    if (!name || !jsType) throw new InvalidSearchParamFormat(key, value)
    if (modifier && modifier !== 'propagate') throw new InvalidModifier(modifier, name)
    if (!name.match(PARAM_NAME_REGEX)) throw new InvalidSearchParamName(name)
    if (!VALID_TYPES.includes(jsType)) throw new InvalidParameterType(jsType, name)
    return {
      name,
      jsType: jsType as JSType,
      tsType: tsType || jsType,
      propagate: modifier === 'propagate',
    }
  }

  private parsePath(path: string, params: Parameter[]): PathObject[] {
    const parts = path.split('/').filter(part => !!part)
    return parts.map(part => {
      const [, name] = part.match(/^{([^}]+)}$/) ?? []
      if (!name) return part
      if (!name.match(PARAM_NAME_REGEX)) throw new InvalidRouteParamName(name)
      const details = params.find(p => p.name === name)
      return details ?? { name, jsType: 'string', tsType: 'string' }
    })
  }

  private parseParams(rawRoute: any): Parameter[] {
    if (!rawRoute) return []
    return Object.keys(rawRoute).reduce<Parameter[]>((result, current) => {
      const pair = { key: current, value: rawRoute[current] }
      return pair.key.startsWith('+') ? result : [...result, this.parseParameter(pair)]
    }, [])
  }

  private parseChildren(rawRoute: any, route?: RouteConfig): RouteConfig[] {
    if (!rawRoute) return []
    return Object.keys(rawRoute).reduce<RouteConfig[]>((result, current) => {
      const pair = { key: current, value: rawRoute[current] }
      return pair.key.startsWith('+') ? [...result, this.parseRoute(pair, route)] : result
    }, [])
  }

  private getQueryParams(
    params: Parameter[],
    routeKey: string,
    ownPath: PathObject[],
    parent: RouteConfig | undefined,
  ): Parameter[] {
    const inheritedQuery = parent?.query?.filter(p => p.propagate) ?? []
    const ownQuery = params.filter((param) => {
      if (parent?.path?.some(p => typeof p === 'object' && p.name === param.name)) {
        throw new SearchParamClashWithRouteParamError(param.name, routeKey)
      }
      if (inheritedQuery.some(p => p.name === param.name)) {
        throw new SearchParamClashWithPropagatedParamError(param.name, routeKey)
      }
      return !ownPath.some(p => typeof p === 'object' && p.name === param.name)
    })
    return [...inheritedQuery, ...ownQuery]
  }

  private parseRouteModule({ key, value }: Pair, parent: RouteConfig | undefined): RouteConfig {
    if (parent) throw new InvalidRouteLinkLevel()
    const [, name, ref, path] = key.match(MODULAR_ROUTE_REGEX) ?? []
    if (!path.startsWith('/')) throw new InvalidPath(path)
    const params = this.parseParams(value)
    const pathObject = this.parsePath(path, params)
    const route: RouteConfig = {
      localKey: name,
      globalKey: ref,
      name,
      path: pathObject,
      query: this.getQueryParams(params, name, pathObject, parent),
    }
    route.children = this.parseChildren(value, route)
    return route
  }

  private parseRoute({ key, value }: Pair, parent: RouteConfig | undefined): RouteConfig {
    if (key.match(MODULAR_ROUTE_REGEX)) return this.parseRouteModule({ key, value }, parent)
    const [, name, path] = key.match(/^\+ (\w+) \(([^)]+)\)\s*$/) ?? [] // + name (path)
    if (!name || !path) throw new InvalidRouteFormat(key)
    if (!path.startsWith('/')) throw new InvalidPath(path)
    const routeKey = parent ? `${parent.localKey}.${name}` : name
    if (this.routeKeys.includes(routeKey)) throw new DuplicatedRouteError(routeKey)
    this.routeKeys.push(routeKey)
    const params = this.parseParams(value)
    const ownPath = this.parsePath(path, params)
    const route: RouteConfig = {
      localKey: routeKey,
      globalKey: parent ? `${parent.globalKey}.${name}` : name,
      name,
      path: [...(parent?.path ?? []), ...ownPath],
      query: this.getQueryParams(params, routeKey, ownPath, parent),
      parent,
    }
    route.children = this.parseChildren(value, route)
    return route
  }

  parse(): Config {
    const yaml = parse(this.config)
    if (typeof yaml !== 'object') throw new InvalidYaml()
    const keys = Object.keys(yaml)
    if (keys.length !== 1) throw new NoRootError()
    return {
      root: this.parseRoute({ key: keys[0], value: yaml[keys[0]] }, undefined),
      isModule: MODULAR_ROUTE_REGEX.test(keys[0]),
    }
  }
}
