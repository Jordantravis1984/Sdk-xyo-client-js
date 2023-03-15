import { LocationPayload, LocationSchema } from '@xyo-network/location-payload-plugin'
import { LocationCertaintyDivinerConfigSchema, LocationCertaintyPayload, LocationCertaintySchema } from '@xyo-network/node-core-model'
import { mock } from 'jest-mock-extended'

import { MongoDBLocationCertaintyDiviner } from '../MongoDBLocationCertaintyDiviner'

describe.skip('MongoDBLocationCertaintyDiviner', () => {
  const logger = mock<Console>()
  let sut: MongoDBLocationCertaintyDiviner
  beforeAll(async () => {
    sut = await MongoDBLocationCertaintyDiviner.create({
      config: { schema: LocationCertaintyDivinerConfigSchema },
      logger,
    })
  })
  describe('divine', () => {
    describe('with valid query', () => {
      it('divines', async () => {
        const noLocations: LocationPayload[] = []
        const noLocationsResult = await sut.divine(noLocations)
        expect(noLocationsResult).toBeArrayOfSize(0)
        const locations: LocationPayload[] = [
          { altitude: 5, quadkey: '0203', schema: LocationSchema },
          { altitude: 300, quadkey: '0102', schema: LocationSchema },
        ]
        const locationsResult = await sut.divine(locations)
        expect(locationsResult).toBeArrayOfSize(1)
        const actual = locationsResult[0] as LocationCertaintyPayload
        expect(actual).toBeObject()
        expect(actual.schema).toBe(LocationCertaintySchema)
      })
    })
  })
})
