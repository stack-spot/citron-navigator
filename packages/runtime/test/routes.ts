import { Route } from '../src/Route'

interface RouteParams {
  'root': void,
  // 'root.testRouteParams': {

  // },
  'root.testSearchParams': {
    str?: 'test',
    num?: 400 | 500 | 600,
    boolT?: boolean,
    boolT2?: boolean,
    boolT3?: boolean,
    boolF?: boolean,
    obj?: Record<string, string>,
    arr?: string[],
    doubleArr?: string[][],
  },
  'root.account': void,
  'root.studios': { like?: string, limit?: number },
  'root.studios.studio': { studioId: string },
  'root.studios.studio.stacks': { studioId: string, tech?: string[], type?: 'own' | 'all' },
  'root.studios.studio.stacks.stack': {
    studioId: string,
    stackId: string,
  },
  'root.studios.studio.stacks.stack.starters': {
    studioId: string,
    stackId: string,
    str?: 'test',
  },
  'root.studios.studio.stacks.stack.starters.starter': {
    studioId: string,
    stackId: string,
    starterId: string,
    str?: 'test',
  },
  'root.studios.studio.plugins': { studioId: string },
}

export class RootRoute extends Route<undefined, RouteParams['root']> {
  constructor() {
    super('root', '/', undefined, {})
  }

  studios = new StudiosRoute(this)
  account = new AccountRoute(this)
  testSearchParams = new TestSearchParamsRoute(this)
}

export class AlternativeRootRoute extends Route<undefined, RouteParams['root']> {
  constructor() {
    super('root', '/', undefined, {})
  }

  workspaces = new WorkspacesRoute(this)
}

export class WorkspacesRoute extends Route<AlternativeRootRoute, void> {
  constructor(parent: AlternativeRootRoute) {
    super('root.workspaces', '/workspaces/*', parent, {})
  }
}

export class AccountRoute extends Route<RootRoute, RouteParams['root.account']> {
  constructor(parent: RootRoute) {
    super('root.account', '/account/*', parent, {})
  }
}

export class ExtendedAccountRoute extends Route<undefined, RouteParams['root.account']> {
  constructor() {
    super('root.account', '/account', undefined, {})
  }

  settings = new SettingsRoute(this)
}

export class SettingsRoute extends Route<ExtendedAccountRoute, void> {
  constructor(parent: ExtendedAccountRoute) {
    super('root.account', '/account/settings', parent, {})
  }
}

class TestSearchParamsRoute extends Route<RootRoute, RouteParams['root.testSearchParams']> {
  constructor(parent: RootRoute) {
    super(
      'root.testSearchParams',
      '/testSearchParams',
      parent,
      {
        str: 'string',
        num: 'number',
        boolT: 'boolean',
        boolT2: 'boolean',
        boolT3: 'boolean',
        boolF: 'boolean',
        arr: 'array',
        obj: 'object',
        doubleArr: 'object',
      },
    )
  }
}

export class StudiosRoute extends Route<RootRoute, RouteParams['root.studios']> {
  constructor(parent: RootRoute) {
    super('root.studios', '/studios', parent, { like: 'string', limit: 'number' })
  }

  studio = new StudioRoute(this)
}

class StudioRoute extends Route<StudiosRoute, RouteParams['root.studios.studio']> {
  constructor(parent: StudiosRoute) {
    super('root.studios.studio', '/studios/{studioId}', parent, { studioId: 'string', create: 'string' })
  }

  stacks = new StacksRoute(this)
  plugins = new PluginsRoute(this)
}

class StacksRoute extends Route<StudioRoute, RouteParams['root.studios.studio.stacks']> {
  constructor(parent: StudioRoute) {
    super('root.studios.studio.stacks', '/studios/{studioId}/stacks', parent, { studioId: 'string', tech: 'array', type: 'string' })
  }

  stack = new StackRoute(this)
}

class StackRoute extends Route<StacksRoute, RouteParams['root.studios.studio.stacks.stack']> {
  constructor(parent: StacksRoute) {
    super(
      'root.studios.studio.stacks.stack',
      '/studios/{studioId}/stacks/{stackId}',
      parent,
      { studioId: 'string', stackId: 'string' },
    )
  }

  starters = new StartersRoute(this)
}

class StartersRoute extends Route<StackRoute, RouteParams['root.studios.studio.stacks.stack.starters']> {
  constructor(parent: StackRoute) {
    super(
      'root.studios.studio.stacks.stack.starters',
      '/studios/{studioId}/stacks/{stackId}/starters',
      parent,
      { studioId: 'string', stackId: 'string', str: 'string' },
    )
  }

  starter = new StarterRoute(this)
}

class StarterRoute extends Route<StartersRoute, RouteParams['root.studios.studio.stacks.stack.starters.starter']> {
  constructor(parent: StartersRoute) {
    super(
      'root.studios.studio.stacks.stack.starters.starter',
      '/studios/{studioId}/stacks/{stackId}/starters/{starterId}', parent,
      { studioId: 'string', stackId: 'string', starterId: 'string', str: 'string' },
    )
  }
}

class PluginsRoute extends Route<StudioRoute, RouteParams['root.studios.studio.plugins']> {
  constructor(parent: StudioRoute) {
    super(
      'root.studios.studio.plugins',
      '/studios/{studioId}/plugins',
      parent,
      { studioId: 'string' },
    )
  }
}
