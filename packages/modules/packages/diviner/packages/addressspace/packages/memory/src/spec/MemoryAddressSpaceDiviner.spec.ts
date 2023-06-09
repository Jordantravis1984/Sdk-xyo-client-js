import { Account } from '@xyo-network/account'
import { ArchivistWrapper, MemoryArchivist } from '@xyo-network/archivist'
import { AddressSpaceDivinerConfigSchema } from '@xyo-network/diviner-address-space-model'
import { DivinerWrapper } from '@xyo-network/diviner-wrapper'
import { MemoryNode } from '@xyo-network/node'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { AddressPayload, AddressSchema } from '@xyo-network/plugins'

import { MemoryAddressSpaceDiviner } from '../MemoryAddressSpaceDiviner'

describe('MemoryAddressSpaceDiviner', () => {
  describe('divine (all archivists)', () => {
    it('returns divined result', async () => {
      const node = await MemoryNode.create()
      const account = Account.random()
      const archivist = ArchivistWrapper.wrap(
        await MemoryArchivist.create({ config: { schema: MemoryArchivist.configSchema, storeQueries: true } }),
        account,
      )

      const payload1 = PayloadWrapper.parse({ index: 1, schema: 'network.xyo.test' })
      const payload2 = PayloadWrapper.parse({ index: 2, schema: 'network.xyo.test' })
      const payload3 = PayloadWrapper.parse({ index: 3, schema: 'network.xyo.test' })

      await archivist.insert([payload1.payload])
      await archivist.insert([payload2.payload])
      await archivist.insert([payload3.payload])

      const all = await archivist.all()

      expect(all).toBeArrayOfSize(7)

      await node.register(archivist)
      await node.attach(archivist.address)
      const diviner = await MemoryAddressSpaceDiviner.create({
        config: { address: account.addressValue.hex, schema: AddressSpaceDivinerConfigSchema },
      })
      await node.register(diviner)
      await node.attach(diviner.address)
      const divinerWrapper = DivinerWrapper.wrap(diviner)
      const result = await divinerWrapper.divine()
      expect(result.length).toBe(2)
      const payload = PayloadWrapper.parse<AddressPayload>(result[0])
      expect(payload.schema).toBe(AddressSchema)
      expect(payload.payload.address).toBe(account.addressValue.hex)
    })
  })
  describe('divine (listed archivists)', () => {
    it('returns divined result', async () => {
      const node = await MemoryNode.create()
      const account = Account.random()
      const archivist = ArchivistWrapper.wrap(
        await MemoryArchivist.create({ config: { schema: MemoryArchivist.configSchema, storeQueries: true } }),
        account,
      )

      const payload1 = PayloadWrapper.parse({ index: 1, schema: 'network.xyo.test' })
      const payload2 = PayloadWrapper.parse({ index: 2, schema: 'network.xyo.test' })
      const payload3 = PayloadWrapper.parse({ index: 3, schema: 'network.xyo.test' })

      await archivist.insert([payload1.payload])
      await archivist.insert([payload2.payload])
      await archivist.insert([payload3.payload])

      const all = await archivist.all()

      expect(all).toBeArrayOfSize(7)

      await node.register(archivist)
      await node.attach(archivist.address)
      const diviner = await MemoryAddressSpaceDiviner.create({
        config: { address: account.addressValue.hex, archivists: [archivist.address], schema: AddressSpaceDivinerConfigSchema },
      })
      await node.register(diviner)
      await node.attach(diviner.address)
      const divinerWrapper = DivinerWrapper.wrap(diviner)
      const result = await divinerWrapper.divine()
      expect(result.length).toBe(1)
      const payload = PayloadWrapper.parse<AddressPayload>(result[0])
      expect(payload.schema).toBe(AddressSchema)
      expect(payload.payload.address).toBe(account.addressValue.hex)
    })
  })
})
