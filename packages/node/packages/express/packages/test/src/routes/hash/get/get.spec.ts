import { Account } from '@xyo-network/account'
import { BoundWitness } from '@xyo-network/boundwitness-model'
import { BoundWitnessWrapper } from '@xyo-network/boundwitness-wrapper'
import { Payload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { ReasonPhrases } from 'http-status-codes'

import { getHash, getNewBlocksWithPayloads, getNewBlockWithPayloads, insertBlock, insertPayload } from '../../../testUtil'

describe('/:hash', () => {
  const account = Account.random()
  describe('return format is', () => {
    const block = getNewBlocksWithPayloads(2, 2)
    expect(block).toBeTruthy()
    const boundWitness = block[0]
    expect(boundWitness).toBeTruthy()
    const boundWitnessHash = new PayloadWrapper(boundWitness).hash
    expect(boundWitnessHash).toBeTruthy()
    const payload = boundWitness?._payloads?.[0]
    expect(payload).toBeTruthy()
    const payloadHash = boundWitness?.payload_hashes?.[0]
    expect(payloadHash).toBeTruthy()
    beforeAll(async () => {
      const blockResponse = await insertBlock(block, account)
      expect(blockResponse.length).toBe(2)
      const payloadResponse = await insertPayload(payload, account)
      expect(payloadResponse.length).toBe(2)
    })
    it('a single bound witness', async () => {
      const response = await getHash(boundWitnessHash)
      expect(response).toBeTruthy()
      expect(Array.isArray(response)).toBe(false)
      const actual = response as BoundWitness
      expect(actual.addresses).toEqual(boundWitness.addresses)
      expect(actual.payload_hashes).toEqual(boundWitness.payload_hashes)
      expect(actual.payload_schemas).toEqual(boundWitness.payload_schemas)
      expect(actual.previous_hashes).toEqual(boundWitness.previous_hashes)
    })
    it('a single payload', async () => {
      const response = await getHash(payloadHash)
      expect(response).toBeTruthy()
      expect(Array.isArray(response)).toBe(false)
      const actual = response as Payload
      expect(actual.schema).toEqual(payload?.schema)
    })
  })
  describe('with public archive', () => {
    const boundWitness = getNewBlockWithPayloads(1)
    expect(boundWitness).toBeTruthy()
    const boundWitnessHash = BoundWitnessWrapper.parse(boundWitness).hash
    expect(boundWitnessHash).toBeTruthy()
    const payload = boundWitness._payloads?.[0]
    expect(payload).toBeTruthy()
    const payloadHash = boundWitness.payload_hashes?.[0]
    expect(payloadHash).toBeTruthy()
    beforeAll(async () => {
      const blockResponse = await insertBlock(boundWitness, account)
      expect(blockResponse.length).toBe(2)
    })
    describe.each([
      ['bound witness', boundWitnessHash],
      ['payload', payloadHash],
    ])('with %s hash', (hashKind, hash) => {
      it(`with anonymous user returns the ${hashKind}`, async () => {
        await getHash(hash)
      })
      it(`with non-archive owner returns the ${hashKind}`, async () => {
        await getHash(hash)
      })
      it(`with archive owner returns the ${hashKind}`, async () => {
        const result = await getHash(hash)
        expect(result).toBeTruthy()
      })
    })
  })
  describe('with private archive', () => {
    const boundWitness = getNewBlockWithPayloads(1)
    expect(boundWitness).toBeTruthy()
    const boundWitnessHash = BoundWitnessWrapper.parse(boundWitness).hash
    expect(boundWitnessHash).toBeTruthy()
    const payload = boundWitness._payloads?.[0]
    expect(payload).toBeTruthy()
    const payloadHash = boundWitness.payload_hashes?.[0]
    expect(payloadHash).toBeTruthy()
    beforeAll(async () => {
      const blockResponse = await insertBlock(boundWitness, account)
      expect(blockResponse.length).toBe(2)
    })
    describe.each([
      ['bound witness', boundWitnessHash],
      ['payload', payloadHash],
    ])('with %s hash', (hashKind, hash) => {
      beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {
          // Stop expected errors from being logged
        })
      })
      describe(`returns ${ReasonPhrases.OK}`, () => {
        it('with anonymous user', async () => {
          await getHash(hash)
        })
        it('with non-archive owner', async () => {
          await getHash(hash)
        })
      })
      it(`with archive owner returns the ${hashKind}`, async () => {
        const result = await getHash(hash)
        expect(result).toBeTruthy()
      })
    })
  })
  describe('with nonexistent hash', () => {
    beforeAll(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {
        // Stop expected errors from being logged
      })
    })
    it(`returns ${ReasonPhrases.NOT_FOUND}`, async () => {
      await getHash('non_existent_hash')
    })
  })
})
