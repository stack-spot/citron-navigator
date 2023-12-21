export type JSType = 'string' | 'number' | 'boolean' | 'array' | 'object'

export interface Parameter {
  name: string,
  jsType: JSType,
  tsType: string,
  propagate?: boolean,
}

export type PathObject = string | Parameter

export interface RouteConfig {
  name: string,
  key: string,
  path: PathObject[],
  query?: Parameter[],
  parent?: RouteConfig,
  children?: RouteConfig[],
}

export interface ProgramArguments {
  src: string,
  out: string,
  baseDir?: string,
}
