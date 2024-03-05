import { LinkedList } from './LinkedList'
import { Route } from './Route'

type RequiredKeysOf<T> = Exclude<{
  [K in keyof T]: T extends Record<K, T[K]>
    ? K
    : never
}[keyof T], undefined>

type MakeCurrentParamsOptional<Current, Target> = {
  [K in keyof Target as K extends RequiredKeysOf<Current> ? K : never]?: Target[K]
} & {
  [K in keyof Target as K extends RequiredKeysOf<Current> ? never : K]: Target[K]
}

export type ContextualizedRoute<T, CurrentParams extends Record<string, any> | void> = T extends Route<infer Parent, infer Params>
  ? (
      Route<ContextualizedRoute<Parent, CurrentParams>, MakeCurrentParamsOptional<CurrentParams, Params>>
      & { [K in keyof T as K extends `$${string}` ? never : K]: ContextualizedRoute<T[K], CurrentParams> }
  ) 
  : undefined

export type VoidOrPromise = void | Promise<void>

export interface NavigationClauses {
  when: Record<string, (props: any) => VoidOrPromise>,
  whenSubrouteOf: LinkedList<{
    key: string,
    handler: (props: any) => VoidOrPromise,
  }>,
  otherwise?: () => VoidOrPromise,
  whenNotFound?: (path: string) => VoidOrPromise,
  initialized?: boolean,
}

export type AnyRouteWithParams<Params extends Record<string, any>> = Route<Route<any, any>, Params, string>
