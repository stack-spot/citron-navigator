import { existsSync } from 'fs'
import { InvalidRouteFormat } from '../src/error'
import { generate, getArguments } from '../src/generate'
import { expectToGenerateCode, mockConsoleLogs, mockExit } from './utils'

describe('Generate', () => {
  it('should use default arguments', () => {
    process.argv = ['/execPath', '/jsPath']
    const args = getArguments()
    expect(args).toMatchObject({ src: 'navigation.yaml', out: 'src/generated/navigation.ts', useHash: true })
  })

  it('should use custom arguments', () => {
    process.argv = ['/execPath', '/jsPath', '--src=custom-file.yaml', '--out=src/custom.ts', '--useHash=false']
    const args = getArguments()
    expect(args).toMatchObject({ src: 'custom-file.yaml', out: 'src/custom.ts', useHash: false })
  })

  it('should generate code with useHash = true', () => expectToGenerateCode('test/navigation.yaml', 'test/generated/navigation.ts'))

  it('should generate code with useHash = false', () => expectToGenerateCode('test/navigation.yaml', 'test/generated/navigation.ts', false))

  it(
    'modular: should generate code for parent',
    () => expectToGenerateCode('test/navigation.parent.yaml', 'test/generated/navigation.parent.ts'),
  )

  it(
    'modular: should generate code for child',
    () => expectToGenerateCode('test/navigation.child.yaml', 'test/generated/navigation.child.ts'),
  )

  it('should fail', async () => {
    const { exitMock, unMockExit } = mockExit()
    const { consoleMock, unMockConsoleLogs } = mockConsoleLogs()
    const out = 'test/generated/navigation.invalid.ts'
    await generate({ src: 'test/navigation.invalid.yaml', out })
    expect(exitMock).toHaveBeenCalledWith(1)
    expect(consoleMock.error).toHaveBeenCalledTimes(2)
    expect(consoleMock.error).toHaveBeenNthCalledWith(1, 'Error while creating navigation file.')
    expect(consoleMock.error).toHaveBeenNthCalledWith(2, expect.any(InvalidRouteFormat))
    unMockExit()
    unMockConsoleLogs()
    expect(existsSync(out)).toBe(false)
  })
})
