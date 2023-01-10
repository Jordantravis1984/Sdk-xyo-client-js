import { assertEx } from '@xylabs/assert'
import { XyoArchivistApi } from '@xyo-network/api'
import { XyoApiConfig, XyoApiResponseBody } from '@xyo-network/api-models'
import {
  AbstractModuleConfig,
  AbstractModuleConfigSchema,
  creatable,
  isQuerySupportedByModule,
  Module,
  ModuleDescription,
  ModuleParams,
  ModuleQueryResult,
  ModuleWrapper,
  XyoQueryBoundWitness,
} from '@xyo-network/module'
import { XyoPayload } from '@xyo-network/payload-model'
export interface HttpProxyModuleParams extends ModuleParams {
  address?: string
  apiConfig: XyoApiConfig
  name?: string
}

@creatable()
export class HttpProxyModule implements Module {
  static configSchema = AbstractModuleConfigSchema
  protected _config: AbstractModuleConfig | undefined
  protected _queries: string[] | undefined

  protected constructor(protected readonly _api: XyoArchivistApi, protected readonly _address: string) {}

  public get address(): string {
    return this._address
  }
  public get config(): AbstractModuleConfig {
    if (!this._config) throw new Error('Missing config')
    return this._config
  }
  static async create(params: HttpProxyModuleParams): Promise<HttpProxyModule> {
    const { address, apiConfig, name } = params
    const api = new XyoArchivistApi(apiConfig)
    let description: XyoApiResponseBody<ModuleDescription>
    if (address) {
      description = await api.addresses.address(address).get()
    } else if (name) {
      description = (await api.node(name).get()) as unknown as XyoApiResponseBody<ModuleDescription>
    } else {
      description = await api.get()
    }
    const addr = assertEx(description?.address)
    const instance = new this(api, addr)
    instance._queries = assertEx(description?.queries, 'Error obtaining module description')
    // NOTE: We can't depend on obtaining the config positionally from
    // the response array and we need to filter on a result that is a
    // config schema (of which there are many) so we're left with
    // string matching for now.
    // A brittle alternative would be to pick off all known response
    // fields (address payload, etc.) and use process of elimination
    const discover = await new ModuleWrapper(instance).discover()
    const config = assertEx(
      discover.find((p) => p.schema.toLowerCase().includes('config')),
      'Error obtaining module config',
    )
    instance._config = config
    return instance
  }
  public as<TModule extends Module = Module>(): TModule {
    return this as unknown as TModule
  }
  public async description(): Promise<ModuleDescription> {
    return assertEx(await this._api.addresses.address(this.address).get())
  }
  public queries(): string[] {
    if (!this._queries) throw new Error('Missing queries')
    return this._queries
  }
  async query<T extends XyoQueryBoundWitness = XyoQueryBoundWitness>(query: T, payloads?: XyoPayload[]): Promise<ModuleQueryResult> {
    const data = payloads?.length ? [query, payloads] : [query]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this._api.addresses.address(this.address).post(data as any)
    return response as unknown as ModuleQueryResult
  }
  public queryable<T extends XyoQueryBoundWitness = XyoQueryBoundWitness>(query: T, payloads?: XyoPayload[]): boolean {
    return isQuerySupportedByModule(this, query, payloads)
  }
}
