import { VALID_TYPES } from './constants'

export class ParseError extends Error {}

export class InvalidYaml extends Error {
  constructor() {
    super('The YAML file is not formatted correctly. Please make sure that:\n  - all parameter values are strings;\n  - all routes start with "+ " and ends with ":".')
  }
}

export class InvalidYamlKeyType extends ParseError {
  constructor(key: string) {
    super(`Error while parsing key "${key}" of yaml. Please make sure that:\n  - all parameter values are strings;\n  - all routes start with "+ " and ends with ":".`)
  }
}

export class InvalidSearchParamFormat extends ParseError {
  constructor(key: string, value: string) {
    super(`Incorrect parameter format: "${key}: ${value}". Expected format is "modifier name: type (typescriptType)", where modifier and typescriptType are optional.`)
  }
}

export class InvalidModifier extends ParseError {
  constructor(modifier: string, parameterName: string) {
    super(`Invalid modifier "${modifier}" for parameter "${parameterName}". Valid options are: "propagate".`)
  }
}

export class InvalidSearchParamName extends ParseError {
  constructor(name: string) {
    super(`Invalid parameter name: ${name}. Please use only numbers, letters and _. Parameters also can't start with number.`)
  }
}

export class InvalidParameterType extends ParseError {
  constructor(type: string, parameterName: string) {
    super(`Invalid type "${type}" for parameter "${parameterName}". Valid options are: ${VALID_TYPES.map(t => `"${t}"`).join(', ')}.`)
  }
}

export class InvalidRouteParamName extends ParseError {
  constructor(name: string) {
    super(`Invalid route parameter: ${name}. Please use only numbers, letters and _. Route parameters also can't start with number.`)
  }
}

export class SearchParamClashWithRouteParamError extends ParseError {
  constructor(parameterName: string, routeKey: string) {
    super(`Parameter "${parameterName}" of route "${routeKey}" has already been defined as a route parameter for a parent route.`)
  }
}

export class SearchParamClashWithPropagatedParamError extends ParseError {
  constructor(parameterName: string, routeKey: string) {
    super(`Parameter "${parameterName}" of route "${routeKey}" has already been defined as a propagated query parameter for a parent route.`)
  }
}

export class InvalidRouteLinkLevel extends ParseError {
  constructor() {
    super('Invalid route module: route modules (~) can only appear at the root level.')
  }
}

export class InvalidPath extends ParseError {
  constructor(path: string) {
    super(`Invalid path: ${path}. Paths must start with "/".`)
  }
}

export class InvalidRouteFormat extends ParseError {
  constructor(key: string) {
    super(`Invalid route key: ${key}. Expected format: + name (path).`)
  }
}

export class DuplicatedRouteError extends ParseError {
  constructor(routeKey: string) {
    super(`Duplicated route: "${routeKey}".`)
  }
}

export class NoRootError extends ParseError {
  constructor() {
    super('Invalid format. Expected a single route at the root level.')
  }
}
