import { WithAdditional } from '@xyo-network/core'
import { Payload } from '@xyo-network/payload-model'

export type ModuleConfigSchema = 'network.xyo.module.config'
export const ModuleConfigSchema: ModuleConfigSchema = 'network.xyo.module.config'

export type AddressString = string
export type CosigningAddressSet = string[]
export type SchemaString = string

export type ModuleConfigBase<TConfig extends Payload | undefined = undefined> = Payload<
  WithAdditional<
    {
      //friendly name of module (not collision resistent)
      name?: string

      //paging settings for queries
      paging?: Record<string, { size?: number }>

      schema: TConfig extends Payload ? TConfig['schema'] : ModuleConfigSchema

      //if both allowed and disallowed is specified, then disallowed takes priority
      security?: {
        //will process queries that have unsigned boundwitness in tuples
        allowAnonymous?: boolean

        //if schema in record, then only these address sets can access query
        allowed?: Record<SchemaString, (AddressString | CosigningAddressSet)[]>

        //if schema in record, then anyone except these addresses can access query
        disallowed?: Record<SchemaString, AddressString[]>
      }

      //store the queries made to the module in an archivist if possible
      storeQueries?: boolean
    },
    Omit<TConfig, 'schema'>
  >
>

export type ModuleConfig<TConfig extends Payload | undefined = undefined> = ModuleConfigBase<TConfig>

export type AnyConfigSchema<TConfig extends Omit<ModuleConfig, 'schema'> & { schema: string } = Omit<ModuleConfig, 'schema'> & { schema: string }> =
  ModuleConfig<
    WithAdditional<
      Omit<TConfig, 'schema'>,
      {
        schema: string
      }
    >
  >

export type OptionalConfigSchema<TConfig extends AnyConfigSchema<ModuleConfig> = AnyConfigSchema<ModuleConfig>> = Omit<TConfig, 'schema'> & {
  schema?: TConfig['schema']
}

export type AnyModuleConfig = AnyConfigSchema<ModuleConfig>
