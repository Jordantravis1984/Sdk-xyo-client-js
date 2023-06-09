import { DivinerWrapper } from '@xyo-network/modules'

import { printError } from '../../../../lib'
import { ModuleArguments } from '../../ModuleArguments'
import { getModuleFromArgs } from '../../util'

export const getDiviner = async (args: ModuleArguments): Promise<DivinerWrapper> => {
  const { verbose } = args
  try {
    const module = await getModuleFromArgs(args)
    const diviner = DivinerWrapper.wrap(module)
    return diviner
  } catch (error) {
    if (verbose) printError(JSON.stringify(error))
    throw new Error('Unable to obtain module for supplied address')
  }
}
