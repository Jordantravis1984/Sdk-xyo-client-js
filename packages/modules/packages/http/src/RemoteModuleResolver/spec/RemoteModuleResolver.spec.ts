import { assertEx } from '@xylabs/assert'
import { AddressPayload, AddressSchema } from '@xyo-network/address-payload-plugin'
import { XyoArchivistApi } from '@xyo-network/api'
import { XyoApiConfig } from '@xyo-network/api-models'
import { ModuleWrapper } from '@xyo-network/module'
import { Module } from '@xyo-network/module-model'
import { MemoryNode, NodeConfigSchema } from '@xyo-network/node'
import { getBoundWitnessArchivistName, getPayloadArchivistName } from '@xyo-network/node-core-lib'

import { RemoteModuleResolver } from '../RemoteModuleResolver'

const apiConfig: XyoApiConfig = { apiDomain: process.env.API_DOMAIN || 'http://localhost:8080' }
const name = 'PayloadDiviner'

describe('RemoteModuleResolver', () => {
  let resolver: RemoteModuleResolver
  let address = ''
  beforeAll(async () => {
    resolver = new RemoteModuleResolver(apiConfig)
    const api = new XyoArchivistApi(apiConfig)
    const response = await api.get()
    expect(response).toBeArray()
    const addressPayload = response?.find((p) => p.schema === AddressSchema) as AddressPayload
    expect(addressPayload).toBeObject()
    expect(addressPayload.address).toBeString()
    address = assertEx(addressPayload?.address)
  })
  describe('resolve', () => {
    it('resolves by address', async () => {
      const mods = await resolver.resolve({ address: [address] })
      await validateModuleResolutionResponse(mods)
    })
    it.skip('resolves by config schema', async () => {
      const mods = await resolver.resolve({ address: [address], config: [NodeConfigSchema] })
      await validateModuleResolutionResponse(mods)
    })
    it('resolves by name', async () => {
      const mods = await resolver.resolve({ name: [name] })
      await validateModuleResolutionResponse(mods)
    })
  })
  describe('when used with MemoryNode', () => {
    let node: MemoryNode
    beforeAll(async () => {
      const config = { schema: NodeConfigSchema }
      const params = { config }
      node = await MemoryNode.create(params)
      node.resolver.addResolver(resolver)
    })
    it('resolves by address', async () => {
      const mods = await node.resolve({ address: [address] })
      await validateModuleResolutionResponse(mods)
    })
    it.skip('resolves by config schema', async () => {
      const mods = await node.resolve({ address: [address], config: [NodeConfigSchema] })
      await validateModuleResolutionResponse(mods)
    })
    it('resolves by name', async () => {
      const mods = await node.resolve({ name: [name] })
      await validateModuleResolutionResponse(mods)
    })
    it('resolves archivist', async () => {
      const name = 'Archivist'
      const mods = await node.resolve({ name: [name] })
      await validateModuleResolutionResponse(mods)
    })
    it('resolves BoundWitness archives', async () => {
      const name = getBoundWitnessArchivistName('temp')
      const mods = await node.resolve({ name: [name] })
      await validateModuleResolutionResponse(mods)
    })
    it('resolves Payload archives', async () => {
      const name = getPayloadArchivistName('temp')
      const mods = await node.resolve({ name: [name] })
      await validateModuleResolutionResponse(mods)
    })
  })
})

const validateModuleResolutionResponse = async (mods: Module[]) => {
  expect(mods).toBeArray()
  expect(mods.length).toBe(1)
  const mod = assertEx(mods.pop())
  const wrapped = new ModuleWrapper(mod)
  const response = await wrapped.discover()
  expect(response).toBeTruthy()
}
