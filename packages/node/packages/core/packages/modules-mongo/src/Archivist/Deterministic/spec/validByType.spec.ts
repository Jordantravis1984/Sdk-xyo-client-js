import { exists } from '@xylabs/exists'
import { Account } from '@xyo-network/account'
import { ArchivistInsertQuery, ArchivistInsertQuerySchema } from '@xyo-network/archivist'
import { BoundWitnessBuilder, BoundWitnessBuilderConfig } from '@xyo-network/boundwitness-builder'
import { QueryBoundWitnessBuilder } from '@xyo-network/module'
import { PayloadWithMeta } from '@xyo-network/node-core-model'
import { PayloadBuilder } from '@xyo-network/payload-builder'
import { Payload } from '@xyo-network/payload-model'

import { validByType } from '../validByType'

const config: BoundWitnessBuilderConfig = { inlinePayloads: true }

type DebugPayloadWithMeta = PayloadWithMeta & { nonce: string }

describe('validByType', () => {
  const account = Account.random()
  describe('QueryBoundWitness with Payloads & nested BoundWitnesses', () => {
    const payload1: Payload = new PayloadBuilder<DebugPayloadWithMeta>({ schema: 'network.xyo.debug' }).fields({ nonce: '1' }).build()
    const payload2: Payload = new PayloadBuilder<DebugPayloadWithMeta>({ schema: 'network.xyo.debug' }).fields({ nonce: '2' }).build()
    const inner = new BoundWitnessBuilder(config).witness(account).payload(payload2).build()
    const outer = new BoundWitnessBuilder(config).witness(account).payloads([payload1, inner[0]]).build()
    const queryHashes = [outer[0], inner[0], payload1, payload2].map((p) => (p as { _hash?: string })?._hash).filter(exists)
    const queryPayload: ArchivistInsertQuery = { payloads: queryHashes, schema: ArchivistInsertQuerySchema }
    const query = new QueryBoundWitnessBuilder(config).witness(account).query(queryPayload).build()
    const values = [query[0], outer[0], inner[0], payload1, payload2] as Payload[]
    const result = values.reduce(validByType, [[], []])
    it('extracts the BoundWitnesses', () => {
      expect(result).toBeArray()
      expect(result?.[0]).toBeArrayOfSize(3)
    })
    it('extracts the Payloads', () => {
      expect(result?.[1]).toBeArrayOfSize(2)
    })
  })
  describe('BoundWitness with Payloads & nested BoundWitnesses', () => {
    const payload1: Payload = new PayloadBuilder<DebugPayloadWithMeta>({ schema: 'network.xyo.debug' }).fields({ nonce: '1' }).build()
    const payload2: Payload = new PayloadBuilder<DebugPayloadWithMeta>({ schema: 'network.xyo.debug' }).fields({ nonce: '2' }).build()
    const inner = new BoundWitnessBuilder(config).witness(account).payload(payload2).build()
    const outer = new BoundWitnessBuilder(config).witness(account).payloads([payload1, inner[0]]).build()
    const values = [outer[0], inner[0], payload1, payload2] as Payload[]
    const result = values.reduce(validByType, [[], []])
    it('extracts the BoundWitnesses', () => {
      expect(result).toBeArray()
      expect(result?.[0]).toBeArrayOfSize(2)
    })
    it('extracts the Payloads', () => {
      expect(result?.[1]).toBeArrayOfSize(2)
    })
  })
  describe('BoundWitness with Payloads', () => {
    const payload1: Payload = new PayloadBuilder<DebugPayloadWithMeta>({ schema: 'network.xyo.debug' }).fields({ nonce: '1' }).build()
    const payload2: Payload = new PayloadBuilder<DebugPayloadWithMeta>({ schema: 'network.xyo.debug' }).fields({ nonce: '2' }).build()
    const outer = new BoundWitnessBuilder(config).witness(account).payloads([payload1, payload2]).build()
    const values = [outer[0], payload1, payload2] as Payload[]
    const result = values.reduce(validByType, [[], []])
    it('extracts the BoundWitnesses', () => {
      expect(result).toBeArray()
      expect(result?.[0]).toBeArrayOfSize(1)
    })
    it('extracts the Payloads', () => {
      expect(result?.[1]).toBeArrayOfSize(2)
    })
  })
  describe('BoundWitness without Payloads', () => {
    const outer = new BoundWitnessBuilder(config).witness(account).build()
    const values = [outer[0]] as Payload[]
    const result = values.reduce(validByType, [[], []])
    it('extracts the BoundWitnesses', () => {
      expect(result).toBeArray()
      expect(result?.[0]).toBeArrayOfSize(1)
    })
    it('extracts the Payloads', () => {
      expect(result?.[1]).toBeArrayOfSize(0)
    })
  })
})
