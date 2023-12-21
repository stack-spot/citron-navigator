export class NavigationError extends Error {
  constructor(message: string) {
    super(`Navigation error: ${message}`)
  }
}

export class RouteParamError extends NavigationError {
  constructor(route: { $key: string, $path: string }, paramName: string) {
    super(`"${paramName}" is a required route parameter for route with key "${route.$key}" and path "${route.$path}".`)
  }
}
