/* eslint-disable no-console */

import { readFile } from 'fs/promises'
import { ConfigParser } from '../src/ConfigParser'
import { generate } from '../src/generate'

export function expectToFail() {
  expect(true).toBe(false)
}

export function expectToThrowWhenParsing(yaml: string, expectedErrorClass: { new(...args: any): Error }) {
  try {
    new ConfigParser(yaml).parse()
    expectToFail()
  } catch (error: any) {
    expect(error).toBeInstanceOf(expectedErrorClass)
  }
}

export async function expectToGenerateCode(src: string, out: string) {
  const { exitMock, unMockExit } = mockExit()
  await generate({ src, out })
  expect(exitMock).toHaveBeenCalledWith(0)
  unMockExit()
  const content = await readFile(out, { encoding: 'utf-8' })
  expect(content).toMatchSnapshot()
}

export function mockExit() {
  const exit = process.exit
  const exitMock = jest.fn()
  process.exit = exitMock as unknown as typeof exit
  const unMockExit = () => process.exit = exit
  return { exitMock, unMockExit }
}

export function mockConsoleLogs() {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  }
  const consoleMock = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
  console.log = consoleMock.log
  console.warn = consoleMock.warn
  console.error = consoleMock.error
  const unMockConsoleLogs = () => {
    console.log = original.log
    console.warn = original.warn
    console.error = original.error
  }
  return { consoleMock, unMockConsoleLogs }
}
