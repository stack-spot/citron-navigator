import { mkdir, writeFile } from 'fs/promises'
import { dirname } from 'path'
import { processString as formatTSFile } from 'typescript-formatter'
import { Config, RouteConfig } from './types'

export class Codegen {
  private routes: RouteConfig[]
  private root: RouteConfig
  private code: string[] = []
  private keyToClassName: Map<string, string> = new Map()
  private isModule: boolean
  private useHash: boolean

  constructor({ root, isModule }: Config, useHash = true) {
    this.isModule = isModule
    this.root = root
    this.useHash = useHash
    this.routes = this.getRouteList(root)
    this.routes.forEach(r => this.createClassName(r.localKey))
    this.write()
  }

  private getRouteList(route: RouteConfig): RouteConfig[] {
    return [route, ...(route.children?.map((r) => this.getRouteList(r)).flat() ?? [])]
  }

  private getParamsType(route: RouteConfig) {
    const params: string[] = []
    route.path.forEach(p => {
      if (typeof p === 'object') params.push(`${p.name}: ${p.tsType}`)
    })
    route.query?.forEach(p => params.push(`${p.name}?: ${p.tsType}`))
    return params.length ? `{ ${params.join(', ')} }` : undefined
  }

  private getParamsObject(route: RouteConfig) {
    const params: string[] = []
    route.path.forEach(p => {
      if (typeof p === 'object') params.push(`${p.name}: '${p.jsType}'`)
    })
    route.query?.forEach(p => params.push(`${p.name}: '${p.jsType}'`))
    return params.length ? `{ ${params.join(', ')} }` : undefined
  }

  private capitalize(str: string) {
    return str ? `${str[0].toUpperCase()}${str.substring(1)}` : str
  }

  private createClassName(key: string) {
    const parts = key.split('.')
    let name = 'Route'
    const usedNames = Array.from(this.keyToClassName.values())
    do {
      const last = parts.pop()
      if (!last) throw new Error(`Invalid route key: ${key}`)
      name = `${this.capitalize(last)}${name}`
    } while (usedNames.includes(name))
    this.keyToClassName.set(key, name)
  }

  private getRouteClass(route: RouteConfig) {
    const name = this.keyToClassName.get(route.localKey)
    const parentName = route.parent ? this.keyToClassName.get(route.parent.localKey) : 'undefined'
    const params = route.parent ? `parent: ${parentName}` : ''
    const path = route.path.map(p => typeof p === 'string' ? p : `{${p.name}}`).join('/').replace(/\/\*\//g, '/')
    return `
      class ${name} extends Route<${parentName}, RouteParams['${route.localKey}']> {
        constructor(${params}) {
          super(
            '${route.globalKey}',
            '/${path}', ${route.parent ? 'parent' : 'undefined'},
            ${this.getParamsObject(route) ?? '{}'},
          )
        }
      
        ${route.children?.map(r => `${r.name} = new ${this.keyToClassName.get(r.localKey)}(this)`).join('\n')}
      }
    `
  }

  private writeImports() {
    this.code.push(`
      import { useCallback, useEffect, useRef, useState } from 'react'
      import { Route, CitronNavigator, AnyRouteWithParams } from '@stack-spot/citron-navigator'
      import { ContextualizedRoute, NavigationClauses, VoidOrPromise } from '@stack-spot/citron-navigator/dist/types'
      import { LinkedList } from '@stack-spot/citron-navigator/dist/LinkedList'
      import { compareRouteKeysDesc } from '@stack-spot/citron-navigator/dist/utils'
    `)
  }

  private writeRouteParamsInterface() {
    this.code.push(`
      interface RouteParams {
        ${this.routes.map(route => `'${route.localKey}': ${this.getParamsType(route) ?? 'void'}`).join(',\n')}
      }
    `)
  }

  private writeRouteClasses() {
    this.routes.forEach(r => {
      this.code.push(this.getRouteClass(r))
      this.code.push('')
    })
  }

  private writeRootAndNavigatorConstants() {
    this.code.push(`export const ${this.root.name} = new ${this.keyToClassName.get(this.root.localKey)}()`)
    if (this.isModule) {
      this.code.push(`
        if (CitronNavigator.instance) {
          CitronNavigator.instance.updateNavigationTree(${this.root.name}, '${this.root.globalKey}')
        } else {
          CitronNavigator.create(${this.root.name} as unknown as Route, ${this.useHash})
        }
        export const navigator = CitronNavigator.instance!
      `)
    } else {
      this.code.push(`export const navigator = CitronNavigator.create(${this.root.name} as unknown as Route, ${this.useHash})`)
    }
  }

  private writeRouteByKeyInterface() {
    this.code.push(`
      const routeByKey: RouteByKey = {
        ${this.routes.map(({ localKey }) => `'${localKey}': ${localKey}`).join(',\n')}
      }
    `)
  }

  private writeRouteByKeyConstant() {
    this.code.push(`
      interface RouteByKey {
        ${this.routes.map(({ localKey }) => `'${localKey}': ${this.keyToClassName.get(localKey)}`).join(',\n')}
      }
    `)
  }

  private writeLocalToGlobalKeyMap() {
    this.code.push(`
      const localToGlobalKeyMap = {
        ${this.routes.map(({ localKey, globalKey }) => `'${localKey}': '${globalKey}'`).join(',\n')}
      }
    `)
  }

  private write() {
    this.writeImports()
    this.code.push('')
    this.writeRouteParamsInterface()
    this.code.push('')
    this.writeRouteClasses()
    this.writeRootAndNavigatorConstants()
    this.code.push('')
    this.writeRouteByKeyInterface()
    this.code.push('')
    this.writeRouteByKeyConstant()
    if (this.isModule) this.writeLocalToGlobalKeyMap()
    this.code.push(`
      export type ViewPropsOf<T extends keyof RouteParams> = RouteParams[T] extends void
        ? { route: RouteByKey[T] }
        : { route: ContextualizedRoute<RouteByKey[T], RouteParams[T]>, params: RouteParams[T] }

      interface NavigationContext {
        when: <T extends keyof RouteParams>(key: T | T[], handler: (props: ViewPropsOf<T>) => VoidOrPromise) => NavigationContext,
        whenSubrouteOf: <T extends keyof RouteParams>(key: T | T[], handler: (props: ViewPropsOf<T>) => VoidOrPromise) => NavigationContext,
        otherwise: (handler: () => VoidOrPromise) => NavigationContext,
        whenNotFound: (handler: (path: string) => VoidOrPromise) => NavigationContext,
      }

      function buildContext(clauses: NavigationClauses) {
        const context: NavigationContext = {
          when: (key, handler) => {
            const keys = Array.isArray(key) ? key : [key]
            keys.forEach(k => clauses.when[k] = handler)
            return context
          },
          whenSubrouteOf: (key, handler) => {
            const keys = Array.isArray(key) ? key : [key]
            keys.forEach(k => clauses.whenSubrouteOf.push({ key: k, handler }))
            return context
          },
          otherwise: (handler) => {
            if (clauses.otherwise) {
              console.warn('Navigation: "otherwise" has been set more than once for the hook "useNavigationContext". Only the last handler will take effect.')
            }
            clauses.otherwise = handler
            return context
          },
          whenNotFound: (handler) => {
            if (clauses.otherwise) {
              console.warn('Navigation: "whenNotFound" has been set more than once for the hook "useNavigationContext". Only the last handler will take effect.')
            }
            clauses.whenNotFound = handler
            return context
          },
        }
        return context
      }

      export function useNavigationContext(navigationHandler: (context: NavigationContext) => void, deps?: any[]) {  
        const queue = useRef<(() => VoidOrPromise)[]>([])
        const consumer = useRef<Promise<void> | undefined>()

        const runEveryHandlerInQueue = useCallback(async () => {
          while (queue.current.length) {
            const handler = queue.current.shift()
            await handler?.()
          }
          consumer.current = undefined
        }, [])

        const consume = useCallback(() => {
          consumer.current ??= runEveryHandlerInQueue()
          return consumer.current
        }, [])

        useEffect(() => {
          const clauses: NavigationClauses = { when: {}, whenSubrouteOf: new LinkedList(compareRouteKeysDesc) }
          navigationHandler(buildContext(clauses))
          const stopListeningToRouteChanges = navigator.onRouteChangeAsync(async (route, params) => {
            const when = Object.keys(clauses.when).find(
              key => route.$is(${this.isModule ? 'localToGlobalKeyMap[key as keyof typeof localToGlobalKeyMap]': 'key'}),
            )
            if (when) queue.current.push(() => clauses.when[when]({ route, params }))
            else {
              const whenSubroute = clauses.whenSubrouteOf.find(
                ({ key }) => route.$isSubrouteOf(${this.isModule ? 'localToGlobalKeyMap[key as keyof typeof localToGlobalKeyMap]': 'key'}),
              )
              if (whenSubroute) {
                queue.current.push(() => whenSubroute.handler({ route: routeByKey[whenSubroute.key as keyof RouteByKey], params }))
              }
              else if (clauses.otherwise) queue.current.push(clauses.otherwise)
            }
            await consume()
          })
          const stopListeningToNotFoundEvents = clauses.whenNotFound ? navigator.onNotFound(clauses.whenNotFound) : undefined
          return () => {
            stopListeningToRouteChanges()
            stopListeningToNotFoundEvents?.()
          }
        }, [])

        useEffect(() => {
          navigator.updateRoute()
        }, deps ?? [])

        return navigationHandler
      }

      interface RouteData<T extends keyof RouteParams> {
        route: AnyRouteWithParams<Partial<RouteParams[T]>>,
        params: Partial<RouteParams[T]>,
      }
      
      export function useRouteData<T extends keyof RouteParams>(_key?: T): RouteData<T> {
        const [data, setData] = useState<RouteData<any>>({ route: navigator.currentRoute ?? root as any, params: navigator.currentParams })
        useEffect(() => navigator.onRouteChange((route, params) => setData({ route, params })), [])
        return data as RouteData<T>
      }
    `)
  }

  private async format(code: string, baseDir?: string) {
    const { error, message } = await formatTSFile(
      'navigation.ts',
      code,
      {
        baseDir,
        replace: false,
        editorconfig: true,
        tsconfig: false,
        tsconfigFile: null,
        tsfmt: true,
        tsfmtFile: null,
        tslint: true,
        tslintFile: null,
        verify: false,
        vscode: true,
        vscodeFile: null,
      },
    )
    if (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to format file: ${message}`)
      return code
    }
    return message
  }

  async writeToFile(path: string, baseDir?: string) {
    if (!this.code.length) this.write()
    const code = this.code.join('\n')
    const formatted = await this.format(code, baseDir)
    try {
      await mkdir(dirname(path))
    } catch { /* empty */ }
    await writeFile(path, formatted, { encoding: 'utf-8' })
  }
}
