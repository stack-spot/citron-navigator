/* eslint-disable no-console */
import { readFile } from 'fs/promises'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Codegen } from './Codegen'
import { ConfigParser } from './ConfigParser'
import { ProgramArguments } from './types'

export function getArguments(): ProgramArguments {
  const args = hideBin(process.argv)
  const data: any = yargs(args).default({ src: 'navigation.yaml', out: 'src/generated/navigation.ts' }).parse(args)
  return { ...data, useHash: data.useHash != 'false' } as ProgramArguments
}

function removeTrailingSlashes(str: string) {
  return str.replace(/^\/+/, '').replace(/\/+$/, '')
}

function uri(baseDir: string | undefined, path: string) {
  return baseDir ? `${removeTrailingSlashes(baseDir ?? '')}/${removeTrailingSlashes(path)}` : path
}

export async function generate({ src, out, baseDir, useHash }: ProgramArguments) {
  try {
    const config = await readFile(uri(baseDir, src), { encoding: 'utf-8' })
    const parser = new ConfigParser(config)
    const route = parser.parse()
    const codegen = new Codegen(route, useHash)
    await codegen.writeToFile(uri(baseDir, out), baseDir)
  } catch (error) {
    console.error('Error while creating navigation file.')
    console.error(error)
    process.exit(1)
  }
  console.info('Navigation file successfully generated.')
  process.exit(0)
}
