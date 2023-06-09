import { EmptyObject } from '@xyo-network/core'
import { ModuleWrapper } from '@xyo-network/module'
import { CommandBuilder, CommandModule } from 'yargs'

import { printError, printLine } from '../../../../lib'
import { BaseArguments } from '../../../BaseArguments'
import { getNode } from '../../../util'

export const aliases: ReadonlyArray<string> = []
export const builder: CommandBuilder = {}
export const command = 'children'
export const deprecated = false
export const describe = 'Describe the children of the XYO Node'
export const handler = async (argv: BaseArguments) => {
  const { verbose } = argv
  try {
    const node = await getNode(argv)
    const description = await node.describe()
    const childAddresses = description?.children || []
    const children = await Promise.all(childAddresses?.map((child) => node.downResolver.resolve({ address: [child] })))
    const childDescriptions = await Promise.all(
      children
        .flat()
        .map((child) => ModuleWrapper.wrap(child))
        .map((mod) => mod.describe()),
    )
    printLine(JSON.stringify(childDescriptions))
  } catch (error) {
    if (verbose) printError(JSON.stringify(error))
    throw new Error('Error Querying Node')
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
