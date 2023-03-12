import { XyoPayload } from '@xyo-network/payload-model'
import { Promisable } from '@xyo-network/promise'

import { EventFunctions } from '../Events'
import { ModuleFilter } from '../ModuleFilter'
import { ModuleQueryResult } from '../ModuleQueryResult'
import { XyoQueryBoundWitness } from '../Query'
import { ModuleConfig } from './Config'
import { AnyConfigSchema, ModuleParams } from './ModuleParams'

export interface ModuleResolver {
  addResolver: (resolver: ModuleResolver) => this
  isModuleResolver: boolean
  removeResolver: (resolver: ModuleResolver) => this
  resolve<T extends Module = Module>(filter?: ModuleFilter): Promisable<T[]>
}

export type Module<TParams extends ModuleParams<AnyConfigSchema<ModuleConfig>> = ModuleParams<AnyConfigSchema<ModuleConfig>>> = {
  address: string
  config: TParams['config']

  /* The resolver is a 'down' resolver.  It can resolve the module or any children (if it is a node for example), that are in the module*/
  readonly downResolver: ModuleResolver

  params: TParams

  queries: string[]
  query: <T extends XyoQueryBoundWitness = XyoQueryBoundWitness, TConf extends ModuleConfig = ModuleConfig>(
    query: T,
    payloads?: XyoPayload[],
    queryConfig?: TConf,
  ) => Promisable<ModuleQueryResult>
  queryable: <T extends XyoQueryBoundWitness = XyoQueryBoundWitness, TConf extends ModuleConfig = ModuleConfig>(
    query: T,
    payloads?: XyoPayload[],
    queryConfig?: TConf,
  ) => Promisable<boolean>

  /* The resolver is a 'up' resolver.  It can resolve the parent or any children of the parent*/
  /* This is set by a NodeModule when attaching to the module */
  readonly upResolver: ModuleResolver
} & EventFunctions<TParams['eventData']>
