import { DivinerWrapper } from '@xyo-network/diviner-wrapper'
import { PayloadBuilder } from '@xyo-network/payload-builder'

import { IdentityDiviner } from '../IdentityDiviner'

describe('DivinerWrapper', () => {
  describe('divine', () => {
    it('returns divined result', async () => {
      const schema = 'network.xyo.debug'
      const diviner = await IdentityDiviner.create()
      const sut = DivinerWrapper.wrap(diviner)
      const payloads = [new PayloadBuilder({ schema }).build()]
      const result = await sut.divine(payloads)
      expect(result).toBeArrayOfSize(payloads.length)
      const [answer] = result
      expect(answer).toBeObject()
      expect(answer.schema).toBe(schema)
    })
  })
})
