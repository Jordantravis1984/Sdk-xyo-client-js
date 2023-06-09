import { assertEx } from '@xylabs/assert'
import { Module, NodeWrapper } from '@xyo-network/modules'
import { NodeModule } from '@xyo-network/node-model'

export const resolveBySymbol = async <T extends Module>(node: NodeModule, name: symbol): Promise<T> => {
  const description = assertEx(name.description, 'Unable to obtain symbol description')
  const nodeWrapper = NodeWrapper.wrap(node)
  const mods = await nodeWrapper.resolve({ name: [description] })
  const mod = assertEx(mods?.[0], `Unable to obtain module with name ${description}`)
  return mod as T
}
