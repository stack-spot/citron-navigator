import { ConfigParser } from '../src/ConfigParser'
import { DuplicatedRouteError, InvalidModifier, InvalidPath, InvalidRouteFormat, InvalidRouteLinkLevel, InvalidRouteParamName, InvalidSearchParamFormat, InvalidSearchParamName, InvalidYaml, InvalidYamlKeyType, NoRootError, SearchParamClashWithPropagatedParamError, SearchParamClashWithRouteParamError } from '../src/error'
import { Config, Parameter } from '../src/types'
import { expectToThrowWhenParsing } from './utils'

describe('ConfigParser', () => {
  it('should parse yaml', () => {
    const yaml = [
      '+ root (/):',
      '  + account (/account):',
      '    + settings (/settings):',
      '  + studios (/studios):',
      '      search: string',
      '      limit: number',
    ].join('\n')
    const config = new ConfigParser(yaml).parse()
    const expectedConfig: Config = {
      root: {
        name: 'root',
        globalKey: 'root',
        localKey: 'root',
        path: [],
        children: [
          {
            name: 'account',
            globalKey: 'root.account',
            localKey: 'root.account',
            path: ['account'],
            children: [
              {
                name: 'settings',
                globalKey: 'root.account.settings',
                localKey: 'root.account.settings',
                path: ['account', 'settings'],
              },
            ],
          },
          {
            name: 'studios',
            globalKey: 'root.studios',
            localKey: 'root.studios',
            path: ['studios'],
            query: [
              { name: 'search', jsType: 'string', tsType: 'string' },
              { name: 'limit', jsType: 'number', tsType: 'number' },
            ],
          },
        ],
      },
      isModule: false,
    }
    expect(config).toMatchObject(expectedConfig)
  })

  it('should parse url param', () => {
    const yaml = '+ test (/test/{variable}):'
    const config = new ConfigParser(yaml).parse()
    const expectedParam: Parameter = expect.objectContaining({ name: 'variable', jsType: 'string', tsType: 'string' })
    expect(config.root.path).toEqual(['test', expectedParam])
  })

  it('should parse typed url param (js)', () => {
    const yaml = [
      '+ test (/{str}/{num}/{obj}/{strArr}/{numArr}/{boolArr}/{bool}):',
      '  str: string',
      '  num: number',
      '  obj: object',
      '  strArr: string[]',
      '  numArr: number[]',
      '  boolArr: boolean[]',
      '  bool: boolean',
    ].join('\n')
    const config = new ConfigParser(yaml).parse()
    const expectedParams: Parameter[] = [
      { name: 'str', jsType: 'string', tsType: 'string' },
      { name: 'num', jsType: 'number', tsType: 'number' },
      { name: 'obj', jsType: 'object', tsType: 'object' },
      { name: 'strArr', jsType: 'string[]', tsType: 'string[]' },
      { name: 'numArr', jsType: 'number[]', tsType: 'number[]' },
      { name: 'boolArr', jsType: 'boolean[]', tsType: 'boolean[]' },
      { name: 'bool', jsType: 'boolean', tsType: 'boolean' },
    ].map(expect.objectContaining)
    expect(config.root.path).toEqual(expectedParams)
  })

  it('should parse typed url param (ts)', () => {
    const yaml = [
      '+ test (/{str}/{num}/{obj}/{strArr}/{numArr}/{boolArr}/{bool}):',
      "  str: string ('option1' | 'option2')",
      '  num: number (Navigation.HttpStatus)',
      '  bool: boolean (true)',
      '  obj: object (Navigation.User)',
      "  strArr: string[] (('a' | 'b' | 'c')[])",
      '  numArr: number[] ((400 | 500 | 600)[])',
      '  boolArr: boolean[] (true[])',
    ].join('\n')
    const config = new ConfigParser(yaml).parse()
    const expectedParams: Parameter[] = [
      { name: 'str', jsType: 'string', tsType: "'option1' | 'option2'" },
      { name: 'num', jsType: 'number', tsType: 'Navigation.HttpStatus' },
      { name: 'obj', jsType: 'object', tsType: 'Navigation.User' },
      { name: 'strArr', jsType: 'string[]', tsType: "('a' | 'b' | 'c')[]" },
      { name: 'numArr', jsType: 'number[]', tsType: '(400 | 500 | 600)[]' },
      { name: 'boolArr', jsType: 'boolean[]', tsType: 'true[]' },
      { name: 'bool', jsType: 'boolean', tsType: 'true' },
    ].map(expect.objectContaining)
    expect(config.root.path).toEqual(expectedParams)
  })

  it('should parse typed search param (js)', () => {
    const yaml = [
      '+ test (/):',
      '  str: string',
      '  num: number',
      '  bool: boolean',
      '  strArr: string[]',
      '  numArr: number[]',
      '  boolArr: boolean[]',
      '  obj: object',
    ].join('\n')
    const config = new ConfigParser(yaml).parse()
    const expectedParams: Parameter[] = [
      { name: 'str', jsType: 'string', tsType: 'string' },
      { name: 'num', jsType: 'number', tsType: 'number' },
      { name: 'bool', jsType: 'boolean', tsType: 'boolean' },
      { name: 'strArr', jsType: 'string[]', tsType: 'string[]' },
      { name: 'numArr', jsType: 'number[]', tsType: 'number[]' },
      { name: 'boolArr', jsType: 'boolean[]', tsType: 'boolean[]' },
      { name: 'obj', jsType: 'object', tsType: 'object' },
    ].map(expect.objectContaining)
    expect(config.root.query).toEqual(expectedParams)
  })

  it('should parse typed search param (ts)', () => {
    const yaml = [
      '+ test (/):',
      "  str: string ('option1' | 'option2')",
      '  num: number (Navigation.HttpStatus)',
      '  obj: object (Navigation.User)',
      "  strArr: string[] (('a' | 'b' | 'c')[])",
      '  numArr: number[] ((400 | 500 | 600)[])',
      '  boolArr: boolean[] (true[])',
    ].join('\n')
    const config = new ConfigParser(yaml).parse()
    const expectedParams: Parameter[] = [
      { name: 'str', jsType: 'string', tsType: "'option1' | 'option2'" },
      { name: 'num', jsType: 'number', tsType: 'Navigation.HttpStatus' },
      { name: 'obj', jsType: 'object', tsType: 'Navigation.User' },
      { name: 'strArr', jsType: 'string[]', tsType: "('a' | 'b' | 'c')[]" },
      { name: 'numArr', jsType: 'number[]', tsType: '(400 | 500 | 600)[]' },
      { name: 'boolArr', jsType: 'boolean[]', tsType: 'true[]' },
    ].map(expect.objectContaining)
    expect(config.root.query).toEqual(expectedParams)
  })

  it('should parse propagated parameter', () => {
    const yaml = [
      '+ root (/):',
      "  propagate hello: string ('world')",
      '  + studios (/studios):',
      '    propagate search: string',
      '    limit: number',
      '    + studio (/studio):',
    ].join('\n')
    const config = new ConfigParser(yaml).parse()
    const params: Record<string, Parameter> = {
      hello: { name: 'hello', jsType: 'string', tsType: "'world'", propagate: true },
      search: { name: 'search', jsType: 'string', tsType: 'string', propagate: true },
      limit: { name: 'limit', jsType: 'number', tsType: 'number', propagate: false },
    }
    expect(config.root.query).toEqual([params.hello])
    expect(config.root.children?.[0]?.query).toEqual([params.hello, params.search, params.limit])
    expect(config.root.children?.[0]?.children?.[0]?.query).toEqual([params.hello, params.search])
  })

  it('should throw if more than one route exists in the root', () => {
    const yaml = [
      '+ root (/r1):',
      '+ otherRoot (/r2):',
    ].join('\n')
    expectToThrowWhenParsing(yaml, NoRootError)
  })

  it('should throw if route format is invalid', () => {
    const yaml = '+ My$Invalid Route:'
    expectToThrowWhenParsing(yaml, InvalidRouteFormat)
  })

  it('should throw if route key is duplicated', () => {
    const yaml = [
      '+ root (/):',
      '  + account (/account):',
      '  + account (/studios):',
    ].join('\n')
    expectToThrowWhenParsing(yaml, DuplicatedRouteError)
  })

  it('should throw if path is invalid', () => {
    const yaml = '+ root (root):'
    expectToThrowWhenParsing(yaml, InvalidPath)
  })

  it('should throw if a search parameter clashes with a route parameter of any ascendant route', () => {
    const yaml = [
      '+ root (/{test}):',
      '  + account (/account):',
      '    test: string',
    ].join('\n')
    expectToThrowWhenParsing(yaml, SearchParamClashWithRouteParamError)
  })

  it('should throw if a search parameter clashes with a search parameter that has been propagated', () => {
    const yaml = [
      '+ root (/):',
      '  propagate test: string',
      '  + account (/account):',
      '    test: string',
    ].join('\n')
    expectToThrowWhenParsing(yaml, SearchParamClashWithPropagatedParamError)
  })

  it('should throw if yaml format is incorrect', () => {
    const yaml = '+ root (/)' // missing ":"
    expectToThrowWhenParsing(yaml, InvalidYaml)
  })

  it('should throw if the name of a route parameter is invalid', () => {
    const yaml = '+ root (/{invalid%name}):'
    expectToThrowWhenParsing(yaml, InvalidRouteParamName)
  })

  it('should throw if the yaml structure is invalid', () => {
    const yaml = [
      '+ root (/):',
      '  - test: string',
    ].join('\n')
    expectToThrowWhenParsing(yaml, InvalidYamlKeyType)
  })

  it('should throw if search parameter format is incorrect', () => {
    const yaml = [
      '+ root (/):',
      '  test: string "hello" | "world"',
    ].join('\n')
    expectToThrowWhenParsing(yaml, InvalidSearchParamFormat)
  })

  it('should throw if the modifier applied to a search parameter is invalid', () => {
    const yaml = [
      '+ root (/):',
      '  private test: string',
    ].join('\n')
    expectToThrowWhenParsing(yaml, InvalidModifier)
  })

  it('should throw if the name of a search parameter is invalid', () => {
    const yaml = [
      '+ root (/):',
      '  1test: string',
    ].join('\n')
    expectToThrowWhenParsing(yaml, InvalidSearchParamName)
  })

  it('should throw if the js type of a search parameter is invalid', () => {
    const yaml = [
      '+ root (/):',
      '  1test: string',
    ].join('\n')
    expectToThrowWhenParsing(yaml, InvalidSearchParamName)
  })

  it('modular: should parse yaml with wildcard', () => {
    const yaml = [
      '+ root (/):',
      '  + account (/account/*):',
    ].join('\n')
    const config = new ConfigParser(yaml).parse()
    const expectedConfig: Config = {
      root: {
        name: 'root',
        globalKey: 'root',
        localKey: 'root',
        path: [],
        children: [
          {
            name: 'account',
            globalKey: 'root.account',
            localKey: 'root.account',
            path: ['account', '*'],
          },
        ],
      },
      isModule: false,
    }
    expect(config).toMatchObject(expectedConfig)
  })

  it('modular: should parse yaml with route links', () => {
    const yaml = [
      '+ root ~ root.account (/account):',
      '  + settings (/settings):',
    ].join('\n')
    const config = new ConfigParser(yaml).parse()
    const expectedConfig: Config = {
      root: {
        name: 'root',
        globalKey: 'root.account',
        localKey: 'root',
        path: ['account'],
        children: [
          {
            name: 'settings',
            globalKey: 'root.account.settings',
            localKey: 'root.settings',
            path: ['account', 'settings'],
          },
        ],
      },
      isModule: true,
    }
    expect(config).toMatchObject(expectedConfig)
  })

  it('modular: should throw if a route other than the root uses a route link', () => {
    const yaml = [
      '+ root (/):',
      '  + account ~ root.account (/account):',
    ].join('\n')
    expectToThrowWhenParsing(yaml, InvalidRouteLinkLevel)
  })

  it('modular: should throw if a path in a route link is invalid', () => {
    const yaml = '+ root ~ root.account (account):'
    expectToThrowWhenParsing(yaml, InvalidPath)
  })
})
