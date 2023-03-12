import { Account } from '@xyo-network/account'
import { XyoBoundWitnessSchema } from '@xyo-network/boundwitness-model'
import { AddressHistoryQueryPayload, AddressHistoryQuerySchema, XyoArchivistPayloadDivinerConfigSchema } from '@xyo-network/diviner'
import { XyoBoundWitnessWithPartialMeta } from '@xyo-network/node-core-model'

import { MongoDBAddressHistoryDiviner } from '../MongoDBAddressHistoryDiviner'

describe('MongoDBAddressHistoryDiviner', () => {
  const phrase = 'test'
  const address = new Account({ phrase }).addressValue.hex
  let sut: MongoDBAddressHistoryDiviner
  beforeEach(async () => {
    sut = (await MongoDBAddressHistoryDiviner.create({ config: { schema: XyoArchivistPayloadDivinerConfigSchema } })) as MongoDBAddressHistoryDiviner
  })
  describe('divine', () => {
    describe('with valid query', () => {
      it('divines', async () => {
        const query: AddressHistoryQueryPayload = { address, limit: 1, schema: AddressHistoryQuerySchema }
        const result = await sut.divine([query])
        expect(result).toBeArrayOfSize(1)
        const actual = result[0] as XyoBoundWitnessWithPartialMeta
        expect(actual).toBeObject()
        expect(actual.schema).toBe(XyoBoundWitnessSchema)
      })
    })
  })
})
