import { LocationCertaintyDiviner } from '@xyo-network/location-certainty-plugin'
import { ModuleParams } from '@xyo-network/module'
import { LocationCertaintyDivinerConfig, LocationCertaintyDivinerConfigSchema, LocationCertaintySchema } from '@xyo-network/node-core-model'
import { JobProvider } from '@xyo-network/shared'
import { merge } from 'lodash-es'

const defaultParams = {
  config: { schema: LocationCertaintyDivinerConfigSchema },
}

export class MongoDBLocationCertaintyDiviner extends LocationCertaintyDiviner implements LocationCertaintyDiviner, JobProvider {
  static override configSchema = LocationCertaintyDivinerConfigSchema

  static override async create(
    params?: Partial<ModuleParams<LocationCertaintyDivinerConfig<LocationCertaintySchema>>>,
  ): Promise<MongoDBLocationCertaintyDiviner> {
    const merged = params
      ? merge({
          defaultParams,
          params,
        })
      : defaultParams
    return (await super.create(merged)) as MongoDBLocationCertaintyDiviner
  }
}
