import { parse } from 'yaml'
import { Config, JSType, Parameter, PathObject, RouteConfig } from './types'

interface Pair {
  key: string,
  value: any,
}

const PARAM_NAME_REGEX = /^[A-z_]\w*$/
const VALID_TYPES = ['string', 'number', 'boolean', 'array', 'object']
const MODULAR_ROUTE_REGEX = /^\+ (\w+) ~ (\w+(?:\.\w+)*) \(([^)]+)\)\s*$/ // + name ~ reference (path)

export class ConfigParser {
  private config: string
  private routeKeys: string[] = []

  constructor(config: string) {
    this.config = config
  }

  private parseParameter({ key, value }: Pair): Parameter {
    if (typeof value !== 'string') {
      throw new Error(
        `Error while parsing key "${key}" of yaml. Please make sure that:\n  - all parameter values are strings;\n  - all routes start with "+ " and ends with ":".`,
      )
    }
    // regex: modifier? name: jsType (tsType)?
    const [, modifier, name] = key.match(/^(?:(\w+)\s+)?(\w+)$/) ?? []
    const [, jsType, tsType] = value.match(/^([^\s]+)(?:\s+\((.+)\))?$/) ?? []
    if (!name || !jsType) {
      throw new Error(
        `Incorrect parameter format: "${key}: ${value}". Expected format is "modifier name: type (typescriptType)", where modifier and typescriptType are optional.`,
      )
    }
    if (modifier && modifier !== 'propagate') {
      throw new Error(`Invalid modifier "${modifier}" for parameter "${name}". Valid options are: "propagate".`)
    }
    if (!name.match(PARAM_NAME_REGEX)) {
      throw new Error(`Invalid parameter name: ${name}. Please use only numbers, letters and _. Parameters also can't start with number.`)
    }
    if (!VALID_TYPES.includes(jsType)) {
      throw new Error(
        `Invalid type "${jsType}" for parameter "${name}". Valid options are: ${VALID_TYPES.map(t => `"${t}"`).join(', ')}.`,
      )
    }
    return { name, jsType: jsType as JSType, tsType: tsType || jsType, propagate: modifier === 'propagate' }
  }

  private parsePath(path: string, params: Parameter[]): PathObject[] {
    const parts = path.split('/').filter(part => !!part)
    return parts.map(part => {
      const [, name] = part.match(/^{([^}]+)}$/) ?? []
      if (!name) return part
      if (!name.match(PARAM_NAME_REGEX)) {
        throw new Error(
          `Invalid route parameter: ${name}. Please use only numbers, letters and _. Route parameters also can't start with number.`,
        )
      }
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
        throw new Error(
          `Parameter "${param.name}" of route "${routeKey}" has already been defined as a route parameter for a parent route.`,
        )
      }
      if (inheritedQuery.some(p => p.name === param.name)) {
        throw new Error(
          `Parameter "${param.name}" of route "${routeKey}" has already been defined as a propagated query parameter for a parent route.`,
        )
      }
      return !ownPath.some(p => typeof p === 'object' && p.name === param.name)
    })
    return [...inheritedQuery, ...ownQuery]
  }

  private parseRouteModule({ key, value }: Pair, parent: RouteConfig | undefined): RouteConfig {
    if (parent) throw new Error('Invalid route module: route modules (~) can only appear at the root level.')
    const [, name, ref, path] = key.match(MODULAR_ROUTE_REGEX) ?? []
    if (!path.startsWith('/')) throw new Error(`Invalid path: ${path}. Paths must start with "/".`)
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
    if (!name || !path) throw new Error(`Invalid route key: ${key}. Expected format: + name (path).`)
    if (!path.startsWith('/')) throw new Error(`Invalid path: ${path}. Paths must start with "/".`)
    const routeKey = parent ? `${parent.localKey}.${name}` : name
    if (this.routeKeys.includes(routeKey)) {
      throw new Error(`Duplicated route: "${routeKey}".`)
    }
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
    const keys = Object.keys(yaml)
    if (keys.length !== 1) {
      throw new Error('Invalid format. Expected a single route at the root level.')
    }
    return {
      root: this.parseRoute({ key: keys[0], value: yaml[keys[0]] }, undefined),
      isModule: MODULAR_ROUTE_REGEX.test(keys[0]),
    }
  }
}
