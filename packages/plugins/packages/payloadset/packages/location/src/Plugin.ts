import { LocationSchema } from '@xyo-network/location-payload-plugin'
import { ModuleParams } from '@xyo-network/module'
import { PayloadSetSchema } from '@xyo-network/payload-model'
import { createPayloadSetPlugin, PayloadSetWitnessPlugin } from '@xyo-network/payloadset-plugin'

import { CurrentLocationWitnessConfig } from './Config'
import { CurrentLocationWitness } from './CurrentLocationWitness'

export const LocationPlugin = () =>
  createPayloadSetPlugin<PayloadSetWitnessPlugin<ModuleParams<CurrentLocationWitnessConfig>>>(
    { required: { [LocationSchema]: 1 }, schema: PayloadSetSchema },
    {
      witness: async (params) => {
        return await CurrentLocationWitness.create(params)
      },
    },
  )
