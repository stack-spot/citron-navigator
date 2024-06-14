export class NavigationError extends Error {
  constructor(message: string) {
    super(`Navigation error: ${message}`)
  }
}

export class NavigationSetupError extends Error {
  constructor(message: string) {
    super(`Navigation setup error: ${message}`)
  }
}
