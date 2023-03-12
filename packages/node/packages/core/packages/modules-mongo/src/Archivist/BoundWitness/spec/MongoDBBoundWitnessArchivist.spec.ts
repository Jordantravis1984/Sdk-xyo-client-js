import { assertEx } from '@xylabs/assert'
import { Account } from '@xyo-network/account'
import { ArchivistConfigSchema } from '@xyo-network/archivist'
import { ArchivistWrapper } from '@xyo-network/archivist-wrapper'
import { BoundWitnessBuilder } from '@xyo-network/boundwitness-builder'
import {
  XyoBoundWitnessFilterPredicate,
  XyoBoundWitnessWithMeta,
  XyoPayloadFilterPredicate,
  XyoPayloadWithMeta,
  XyoPayloadWithPartialMeta,
} from '@xyo-network/node-core-model'
import { XyoPayloadBuilder } from '@xyo-network/payload-builder'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { v4 } from 'uuid'

import { COLLECTIONS } from '../../../collections'
import { getBaseMongoSdk } from '../../../Mongo'
import { MongoDBBoundWitnessArchivist } from '../MongoDBBoundWitnessArchivist'

const count = 2
const schema = 'network.xyo.debug'
const limit = 1

type DebugPayloadWithMeta = XyoPayloadWithMeta & { nonce: string }

const getPayloads = (archive: string, count = 1): DebugPayloadWithMeta[] => {
  const payloads: DebugPayloadWithMeta[] = []
  for (let i = 0; i < count; i++) {
    const nonce = v4()
    const payload = new XyoPayloadBuilder<DebugPayloadWithMeta>({ schema }).fields({ nonce }).build()
    payload._archive = archive
    payloads.push(payload)
  }
  return payloads
}

const removePayloads = (boundWitness: XyoBoundWitnessWithMeta) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _payloads, _timestamp, timestamp, ...props } = boundWitness
  return { ...props, _timestamp: expect.toBeNumber(), timestamp: expect.toBeNumber() }
}

describe('MongoDBBoundWitnessArchivist', () => {
  const sdk = getBaseMongoSdk<XyoBoundWitnessWithMeta>(COLLECTIONS.BoundWitnesses)
  const account = Account.random()
  const archive = `test-${v4()}`
  const payloads = getPayloads(archive, count)
  const boundWitnesses = payloads
    .map((p) => new BoundWitnessBuilder({ inlinePayloads: true }).witness(account).payload(p).build())
    .map((buildResult) => buildResult[0])
    .map((bw) => {
      return { ...bw, _archive: archive } as XyoBoundWitnessWithMeta & XyoPayloadWithPartialMeta
    })
  const hashes: string[] = boundWitnesses.map((bw) => new PayloadWrapper(bw).hash)
  const boundWitness = assertEx(boundWitnesses.at(-1))
  const hash = assertEx(hashes.at(-1))
  let wrapper: ArchivistWrapper

  beforeAll(async () => {
    const params = { account, config: { schema: ArchivistConfigSchema }, sdk }
    const sut = await MongoDBBoundWitnessArchivist.create(params)
    wrapper = ArchivistWrapper.wrap(sut)
    const result = await wrapper.insert(boundWitnesses)
    expect(result).toBeArrayOfSize(count)
    expect(result?.[0].addresses).toContain(account.addressValue.hex)
    expect(result?.[1].payload_hashes).toIncludeAllMembers(hashes)
  })

  describe('insert', () => {
    it('inserts multiple boundWitnesses', async () => {
      // NOTE: Done as part of beforeAll out of necessity
      // for subsequent tests. Not repeated again here for
      // performance.
    })
  })
  describe('find', () => {
    it('get boundWitnesses by hash', async () => {
      const result = await wrapper.get([hash])
      expect(result).toBeArrayOfSize(limit)
      expect(result).toEqual([boundWitness].map(removePayloads))
    })
    it('finds boundWitnesses by address', async () => {
      const addresses = [`${account.addressValue.hex}`]
      const filter: XyoBoundWitnessFilterPredicate = { addresses, limit }
      const result = await wrapper.find(filter)
      expect(result).toBeArrayOfSize(limit)
      expect(result).toEqual([boundWitness].map(removePayloads))
    })
  })
  describe('get', () => {
    it('gets boundWitnesses by hashes', async () => {
      const result = await wrapper.get(hashes)
      expect(result).toBeArrayOfSize(count)
      expect(result).toContainValues([boundWitness].map(removePayloads))
    })
  })
})
