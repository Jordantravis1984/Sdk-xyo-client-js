import { AbstractArchivist } from '@xyo-network/archivist'
import { BoundWitnessDiviner } from '@xyo-network/diviner-boundwitness-abstract'
import { DivinerModule } from '@xyo-network/diviner-model'
import { mock } from 'jest-mock-extended'

import { CoinCurrentUserWitnessPayload, CoinCurrentUserWitnessSchema, MemoryCoinUserLocationsDiviner } from '../UserLocationsDiviner'

describe('MemoryCoinUserLocationsDiviner', () => {
  const payloads = mock<AbstractArchivist>()
  const bws = mock<DivinerModule & BoundWitnessDiviner>()
  const logger = mock<Console>()
  let sut: MemoryCoinUserLocationsDiviner
  beforeAll(async () => {
    sut = await MemoryCoinUserLocationsDiviner.create({
      bws,
      config: { schema: MemoryCoinUserLocationsDiviner.configSchema },
      payloads,
    })
    sut.params.logger = logger
  })
  describe('divine', () => {
    describe('with valid query', () => {
      it('divines', async () => {
        const query: CoinCurrentUserWitnessPayload = { schema: CoinCurrentUserWitnessSchema, uid: 'test' }
        const result = await sut.divine([query])
        expect(result).toBeArrayOfSize(0)
        //const actual = result[0] as Payload
        //expect(actual).toBeObject()
        //expect(actual.schema).toBe(XyoLocationSchema)
      })
    })
  })
})
