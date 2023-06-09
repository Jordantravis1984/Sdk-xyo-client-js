import { AnyObject } from '@xyo-network/core'
import { AnyConfigSchema, Module, ModuleEventData, ModuleParams } from '@xyo-network/module-model'
import { Promisable } from '@xyo-network/promise'

import { NodeConfig } from './Config'
import { ModuleAttachedEventData, ModuleDetachedEventData, ModuleRegisteredEventData, ModuleUnregisteredEventData } from './Events'

export interface Node {
  attach(nameOrAddress: string, external?: boolean): Promisable<string | undefined>
  attached(): Promisable<string[]>
  detach(nameOrAddress: string): Promisable<string | undefined>
  registered(): Promisable<string[]>
}

export interface NodeModuleEventData
  extends ModuleAttachedEventData,
    ModuleDetachedEventData,
    ModuleRegisteredEventData,
    ModuleUnregisteredEventData,
    ModuleEventData {}

export type NodeModuleParams<
  TConfig extends AnyConfigSchema<NodeConfig> = AnyConfigSchema<NodeConfig>,
  TAdditionalParams extends AnyObject | undefined = undefined,
> = ModuleParams<TConfig, TAdditionalParams>

export type NodeModule<TParams extends NodeModuleParams = NodeModuleParams, TEventData extends NodeModuleEventData = NodeModuleEventData> = Node &
  Module<TParams, TEventData>
