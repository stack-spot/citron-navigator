/* eslint-disable no-console */
import { readFile } from 'fs/promises'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Codegen } from './Codegen'
import { ConfigParser } from './ConfigParser'
import { ProgramArguments } from './types'

function getArguments(): ProgramArguments {
  const argv = yargs(hideBin(process.argv)).argv
  const defaults: ProgramArguments = { src: 'navigation.yaml', out: 'src/generated/navigation.ts' }
  return { ...defaults, ...argv }
}

function removeTrailingSlashes(str: string) {
  return str.replace(/^\/+/, '').replace(/\/+$/, '')
}

function uri(baseDir: string | undefined, path: string) {
  return `${removeTrailingSlashes(baseDir ?? '')}/${removeTrailingSlashes(path)}`
}

export async function generate({ src, out, baseDir }: ProgramArguments) {
  try {
    const config = await readFile(uri(baseDir, src), { encoding: 'utf-8' })
    const parser = new ConfigParser(config)
    const route = parser.parse()
    const codegen = new Codegen(route)
    await codegen.writeToFile(uri(baseDir, out), baseDir)
  } catch (error) {
    console.error('Error while creating navigation file.')
    console.error(error)
    process.exit(1)
  }
  console.info('Navigation file successfully generated.')
  process.exit(0)
}

generate(getArguments())
