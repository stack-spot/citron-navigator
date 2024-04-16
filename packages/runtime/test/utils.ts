export function expectToFail() {
  expect(true).toBe(false)
}

export function mockLocation(url: string) {
  Object.defineProperty(window, 'location', {
    value: {
      ...location,
      href: url,
      toString: () => url,
    },
    writable: true,
  })
}
