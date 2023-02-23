import { assertEx } from '@xylabs/assert'
import { AbstractBridge } from '@xyo-network/abstract-bridge'
import { AddressPayload, AddressSchema } from '@xyo-network/address-payload-plugin'
import { XyoApiEnvelope } from '@xyo-network/api-models'
import { AxiosError, AxiosJson } from '@xyo-network/axios'
import { BridgeModule } from '@xyo-network/bridge-model'
import { BridgeModuleResolver } from '@xyo-network/bridge-module-resolver'
import {
  ModuleConfig,
  ModuleDiscoverQuery,
  ModuleDiscoverQuerySchema,
  ModuleFilter,
  ModuleParams,
  ModuleQueryResult,
  ModuleResolver,
  XyoQueryBoundWitness,
} from '@xyo-network/module'
import { XyoPayload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { Promisable } from '@xyo-network/promise'
import { QueryPayload, QuerySchema } from '@xyo-network/query-payload-plugin'
import compact from 'lodash/compact'

import { HttpBridgeConfig } from './HttpBridgeConfig'

export interface XyoHttpBridgeParams<TConfig extends HttpBridgeConfig = HttpBridgeConfig> extends ModuleParams<TConfig> {
  axios?: AxiosJson
}

export class HttpBridge<TConfig extends HttpBridgeConfig = HttpBridgeConfig> extends AbstractBridge<TConfig> implements BridgeModule<TConfig> {
  private _targetQueries: Record<string, string[]> = {}
  private _targetResolver: ModuleResolver
  private axios: AxiosJson

  protected constructor(params: XyoHttpBridgeParams<TConfig>) {
    super(params)
    this.axios = params.axios ?? new AxiosJson()
    this._targetResolver = new BridgeModuleResolver(this)
  }

  public get nodeUri() {
    return assertEx(this.config?.nodeUri, 'Missing nodeUri')
  }

  public get targetAddress() {
    return assertEx(this.config?.targetAddress, 'targetAddress not set')
  }

  public get targetResolver() {
    return this._targetResolver
  }

  static override async create(params: XyoHttpBridgeParams): Promise<HttpBridge> {
    const result = (await super.create(params)) as HttpBridge
    const discover = await result.targetDiscover(params.config.targetAddress ?? '')
    await Promise.all(
      discover.map((payload) => {
        const addressPayload = payload as AddressPayload
        if (addressPayload.schema === AddressSchema) {
          return result.targetDiscover(addressPayload.address)
        }
      }),
    )
    return result
  }

  connect(): Promisable<boolean> {
    return true
  }

  disconnect(): Promisable<boolean> {
    return true
  }

  async targetDiscover(address: string): Promise<XyoPayload[]> {
    const queryPayload = PayloadWrapper.parse<ModuleDiscoverQuery>({ schema: ModuleDiscoverQuerySchema })
    const boundQuery = await this.bindQuery(queryPayload)
    const discover = assertEx(await this.targetQuery(address, boundQuery[0], boundQuery[1]), `Unable to resolve [${address}]`)[1]

    this._targetQueries[address] = compact(
      discover?.map((payload) => {
        if (payload.schema === QuerySchema) {
          const schemaPayload = payload as QueryPayload
          return schemaPayload.query
        } else {
          return null
        }
      }) ?? [],
    )

    return discover
  }

  public targetQueries(address: string): string[] {
    return assertEx(this._targetQueries[address], `targetConfig not set [${address}]`)
  }

  async targetQuery(address: string, query: XyoQueryBoundWitness, payloads: XyoPayload[] = []): Promise<ModuleQueryResult> {
    try {
      const path = `${this.nodeUri}/${address ? address : ''}`
      const result = await this.axios.post<XyoApiEnvelope<ModuleQueryResult>>(path, [query, payloads])
      if (result.status >= 400) {
        this.logger?.error(`targetQuery failed [${path}]`)
        throw `targetQuery failed [${path}] [${result.status}]`
      }
      return result.data.data
    } catch (ex) {
      const error = ex as AxiosError
      this.logger?.error(`Error Status: ${error.status}`)
      this.logger?.error(`Error Cause: ${JSON.stringify(error.cause, null, 2)}`)
      throw error
    }
  }

  targetQueryable(_address: string, _query: XyoQueryBoundWitness, _payloads?: XyoPayload[], _queryConfig?: ModuleConfig): boolean {
    return true
  }

  async targetResolve(address: string, filter?: ModuleFilter) {
    return await this.targetResolver.resolve(filter)
  }
}
