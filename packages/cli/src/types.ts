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
  /**
   * Key used for references in the local project.
   */
  localKey: string,
  /**
   * Key used for references in the global project.
   * If this is not a module of a bigger project, will be the same as `localKey`.
   */
  globalKey: string,
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

export interface Config {
  root: RouteConfig,
  isModule: boolean,
}
