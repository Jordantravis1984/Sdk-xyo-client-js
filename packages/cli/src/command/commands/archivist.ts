import { EmptyObject } from '@xyo-network/core'
import { ArchivistGetQuerySchema, ModuleWrapper } from '@xyo-network/modules'
import { parse } from 'path'
import { ArgumentsCamelCase, Argv, CommandBuilder, CommandModule } from 'yargs'

import { printError, printLine } from '../../lib'
import { BaseArguments } from '../BaseArguments'
import { opts } from '../requireDirectoryOptions'
import { getNode } from '../util'

export const aliases: ReadonlyArray<string> = []
export const builder: CommandBuilder = (yargs: Argv) =>
  yargs.usage('Usage: $0 archivist <query> <address> [Options]').commandDir(parse(__filename).name, opts)
export const command = 'archivist'
export const deprecated = false
export const describe = 'Issue queries against an XYO archivist'
export const handler = async (argv: ArgumentsCamelCase<BaseArguments>) => {
  const { verbose } = argv
  try {
    const node = await getNode(argv)
    const modules = await node.downResolver.resolve({ query: [[ArchivistGetQuerySchema]] })
    const descriptions = await Promise.all(modules.map((a) => ModuleWrapper.wrap(a).describe()))
    printLine(JSON.stringify(descriptions))
  } catch (error) {
    if (verbose) printError(JSON.stringify(error))
    throw new Error('Error querying for archivists')
  }
}

const mod: CommandModule<EmptyObject, BaseArguments> = {
  aliases,
  command,
  deprecated,
  describe,
  handler,
}

// eslint-disable-next-line import/no-default-export
export default mod
