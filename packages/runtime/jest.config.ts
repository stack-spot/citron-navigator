/* eslint-disable import/no-default-export */

import type { Config } from 'jest'

const config: Config = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/test/**/*.spec.{ts,tsx}'],
}

export default config
