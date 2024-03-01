export class NavigationError extends Error {
  constructor(message: string) {
    super(`Navigation error: ${message}`)
  }
}
