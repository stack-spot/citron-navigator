import { readFile, writeFile } from 'fs/promises'

const src = '../../README.md' // this is run from within a package
const dest = 'README.md'
const gitUrl = 'https://github.com/stack-spot/citron-navigator/blob/main'


async function start() {
  try {
    const readme = await readFile(src, { encoding: 'utf-8' })
    const readmeWithAbsoluteLinks = readme.replace(/(\[.*\])\(([^:)]*)\)/g, `$1(${gitUrl}/$2)`)
    await writeFile(dest, readmeWithAbsoluteLinks, { encoding: 'utf-8' })
    process.exit(0)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }
}

start()
