import { XyoPayload } from '@xyo-network/payload-model'
import { Promisable } from '@xyo-network/promise'

import { ModuleDescription } from '../ModuleDescription'
import { ModuleQueryResult } from '../ModuleQueryResult'
import { XyoQueryBoundWitness } from '../Query'

export interface Module<TConfig extends XyoPayload = XyoPayload> {
  address: string
  config: TConfig
  description: () => Promisable<ModuleDescription>
  queries: () => string[]
  query: <T extends XyoQueryBoundWitness = XyoQueryBoundWitness>(
    query: T,
    payloads?: XyoPayload[],
    queryConfig?: TConfig,
  ) => Promisable<ModuleQueryResult>
  queryable: <T extends XyoQueryBoundWitness = XyoQueryBoundWitness>(query: T, payloads?: XyoPayload[], queryConfig?: TConfig) => boolean
}
