import { ConfigParser } from '../src/ConfigParser'

export function expectToFail() {
  expect(true).toBe(false)
}

export function expectToThrowWhenParsing(yaml: string, expectedErrorClass: { new(...args: any): Error }) {
  try {
    new ConfigParser(yaml).parse()
    expectToFail()
  } catch (error: any) {
    expect(error instanceof expectedErrorClass).toBe(true)
  }
}
