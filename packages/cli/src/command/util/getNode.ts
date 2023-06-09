import { assertEx } from '@xylabs/assert'
import { HttpBridge } from '@xyo-network/http-bridge'
import { NodeModule, NodeWrapper } from '@xyo-network/modules'

import { printError } from '../../lib'
import { BaseArguments } from '../BaseArguments'
import { getBridgeConfig } from './getBridgeConfig'

export const getNode = async (args: BaseArguments): Promise<NodeWrapper> => {
  const { verbose } = args
  try {
    const config = await getBridgeConfig(args)
    const bridge = await HttpBridge.create({ config })
    const node = assertEx((await bridge.downResolver.resolve({ address: [bridge.rootAddress] }))?.pop(), 'Failed to resolve rootNode')
    return NodeWrapper.wrap(node as NodeModule)
  } catch (error) {
    if (verbose) printError(JSON.stringify(error))
    throw new Error('Unable to connect to XYO Node')
  }
}
