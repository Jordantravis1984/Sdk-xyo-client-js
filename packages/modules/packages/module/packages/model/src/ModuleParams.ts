import { AccountInstance } from '@xyo-network/account-model'
import { AnyObject, BaseParams, WithAdditional } from '@xyo-network/core'
import { EventData, EventDataParams } from '@xyo-network/module-events'
import { WalletInstance } from '@xyo-network/wallet-model'

import { ModuleConfig } from './Config'

export type BasicModuleParams<
  TConfig extends AnyConfigSchema<ModuleConfig>,
  TEventData extends EventData | undefined = undefined,
  TAdditionalParams extends AnyObject | undefined = undefined,
> = WithAdditional<
  EventDataParams<
    TEventData,
    BaseParams<{
      config: TConfig
    }>
  >,
  TAdditionalParams
>

export type AccountModuleParams<
  TConfig extends AnyConfigSchema<ModuleConfig>,
  TEventData extends EventData | undefined = undefined,
  TAdditionalParams extends AnyObject | undefined = undefined,
> = BasicModuleParams<
  TConfig,
  TEventData,
  WithAdditional<
    {
      account: AccountInstance
    },
    TAdditionalParams
  >
>

export type WalletModuleParams<
  TConfig extends AnyConfigSchema<ModuleConfig>,
  TEventData extends EventData | undefined = undefined,
  TAdditionalParams extends AnyObject | undefined = undefined,
> = BasicModuleParams<
  TConfig,
  TEventData,
  WithAdditional<
    {
      accountDerivationPath: string
      wallet: WalletInstance
    },
    TAdditionalParams
  >
>

export type ModuleParams<
  TConfig extends AnyConfigSchema<ModuleConfig> = AnyConfigSchema<ModuleConfig>,
  TEventData extends EventData | undefined = undefined,
  TAdditionalParams extends AnyObject | undefined = undefined,
> =
  | AccountModuleParams<TConfig, TEventData, TAdditionalParams>
  | WalletModuleParams<TConfig, TEventData, TAdditionalParams>
  | BasicModuleParams<TConfig, TEventData, TAdditionalParams>

export type AnyConfigSchema<TConfig extends Omit<ModuleConfig, 'schema'> & { schema: string }> = ModuleConfig<
  WithAdditional<
    Omit<TConfig, 'schema'>,
    {
      schema: string
    }
  >
>

export type OptionalConfigSchema<TConfig extends AnyConfigSchema<ModuleConfig>> = Omit<TConfig, 'schema'> & { schema?: TConfig['schema'] }