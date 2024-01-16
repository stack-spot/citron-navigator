import { mkdir, writeFile } from 'fs/promises'
import { dirname } from 'path'
import { processString as formatTSFile } from 'typescript-formatter'
import { RouteConfig } from './types'

export class Codegen {
  private routes: RouteConfig[]
  private code: string[] = []
  private keyToClassName: Map<string, string> = new Map()

  constructor(root: RouteConfig) {
    this.routes = this.getRouteList(root)
    this.routes.forEach(r => this.createClassName(r.key))
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
    const name = this.keyToClassName.get(route.key)
    const parentName = route.parent ? this.keyToClassName.get(route.parent.key) : 'undefined'
    const params = route.parent ? `parent: ${parentName}` : ''
    const path = route.path.map(p => typeof p === 'string' ? p : `{${p.name}}`).join('/')
    return `
      class ${name} extends Route<${parentName}, RouteParams['${route.key}']> {
        constructor(${params}) {
          super('${route.key}', '/${path}', ${route.parent ? 'parent' : 'undefined'}, ${this.getParamsObject(route) ?? '{}'})
        }
      
        ${route.children?.map(r => `${r.name} = new ${this.keyToClassName.get(r.key)}(this)`).join('\n')}
      }
    `
  }

  private writeImports() {
    this.code.push(`
      import { useEffect } from 'react'
      import { Route, CitronNavigator } from '@stack-spot/citron-navigator'
      import { ContextualizedRoute, NavigationClauses } from '@stack-spot/citron-navigator/dist/types'
      import { LinkedList } from '@stack-spot/citron-navigator/dist/LinkedList'
      import { compareRouteKeysDesc } from '@stack-spot/citron-navigator/dist/utils'
    `)
  }

  private writeRouteParamsInterface() {
    this.code.push(`
      interface RouteParams {
        ${this.routes.map(route => `'${route.key}': ${this.getParamsType(route) ?? 'void'}`).join(',\n')}
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
    const root = this.routes[0]
    this.code.push(`
      export const ${root.name} = new ${this.keyToClassName.get(root.key)}()
      export const navigator = new CitronNavigator(${root.name} as unknown as Route) // fixme
    `)
  }

  private writeRouteByKeyInterface() {
    this.code.push(`
      const routeByKey: RouteByKey = {
        ${this.routes.map(({ key }) => `'${key}': ${key}`).join(',\n')}
      }
    `)
  }

  private writeRouteByKeyConstant() {
    this.code.push(`
      interface RouteByKey {
        ${this.routes.map(({ key }) => `'${key}': ${this.keyToClassName.get(key)}`).join(',\n')}
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
    this.code.push(`
      export type ViewPropsOf<T extends keyof RouteParams> = RouteParams[T] extends void
        ? { route: RouteByKey[T] }
        : { route: ContextualizedRoute<RouteByKey[T], RouteParams[T]>, params: RouteParams[T] }

      interface NavigationContext {
          when: <T extends keyof RouteParams>(key: T, handler: (props: ViewPropsOf<T>) => void) => NavigationContext,
          whenSubrouteOf: <T extends keyof RouteParams>(key: T, handler: (props: ViewPropsOf<T>) => void) => NavigationContext,
          otherwise: (handler: () => void) => NavigationContext,
          enforceAllViews: () => NavigationContext,
      }

      function buildContext(clauses: NavigationClauses) {
        const context: NavigationContext = {
          when: (key, handler) => {
            clauses.when[key] = handler
            return context
          },
          whenSubrouteOf: (key, handler) => {
            clauses.whenSubrouteOf.push({ key, handler })
            return context
          },
          otherwise: (handler) => {
            if (clauses.otherwise) {
              // eslint-disable-next-line no-console
              console.warn('Navigation: "otherwise" has been set more than once for the hook "useNavigationContext". Only the last handler will take effect.')
            }
            clauses.otherwise = handler
            return context
          },
          enforceAllViews: () => {
            clauses.enforceAllViews = true
            return context
          },
        }
        return context
      }

      export function useNavigationContext(navigationHandler: (context: NavigationContext) => void, deps?: any[]) {  
        useEffect(() => {
          const clauses: NavigationClauses = { when: {}, whenSubrouteOf: new LinkedList(compareRouteKeysDesc) }
          navigationHandler(buildContext(clauses))
          if (clauses.enforceAllViews) {
            // todo: certify every view will have a handler (ignoring "otherwise").
          }
          return navigator.onRouteChange((route, params) => {
            const when = Object.keys(clauses.when).find(key => route.$is(key))
            if (when) {
              clauses.when[when]({ route, params })
              return
            }
            const whenSubroute = clauses.whenSubrouteOf.find(({ key }) => route.$isSubrouteOf(key))
            if (whenSubroute) {
              whenSubroute.handler({ route: routeByKey[whenSubroute.key as keyof RouteByKey], params })
              return
            }
            if (clauses.otherwise) clauses.otherwise()
          })
        }, [])

        useEffect(() => navigator.updateRoute(), deps ?? [])

        return navigationHandler
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
