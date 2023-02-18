import { assertEx } from '@xylabs/assert'
import { Account } from '@xyo-network/account'
import { Axios, AxiosError, AxiosJson, AxiosRequestHeaders, RawAxiosJsonRequestConfig } from '@xyo-network/axios'
import {
  AbstractModule,
  ModuleParams,
  ModuleQueryResult,
  QueryBoundWitnessWrapper,
  XyoErrorBuilder,
  XyoQuery,
  XyoQueryBoundWitness,
} from '@xyo-network/module'
import { XyoPayload } from '@xyo-network/payload-model'
import { Promisable } from '@xyo-network/promise'

import { BridgeModule } from './Bridge'
import { BridgeConfig } from './Config'
import { XyoBridgeConnectQuerySchema, XyoBridgeDisconnectQuerySchema, XyoBridgeQuery } from './Queries'

export type HttpBridgeConfigSchema = 'network.xyo.bridge.http.config'
export const HttpBridgeConfigSchema: HttpBridgeConfigSchema = 'network.xyo.bridge.http.config'

export type HttpBridgeConfig = BridgeConfig<{
  axios?: RawAxiosJsonRequestConfig
  headers?: AxiosRequestHeaders
  schema: HttpBridgeConfigSchema
}>

export interface XyoHttpBridgeParams<TConfig extends HttpBridgeConfig = HttpBridgeConfig> extends ModuleParams<TConfig> {
  axios: Axios
}

export class HttpBridge<TConfig extends HttpBridgeConfig = HttpBridgeConfig> extends AbstractModule<TConfig> implements BridgeModule {
  private axios: AxiosJson

  protected constructor(params: XyoHttpBridgeParams<TConfig>) {
    super(params)
    this.axios = new AxiosJson(this.config?.axios)
  }

  public get nodeUri() {
    return assertEx(this.config?.nodeUri, 'Missing nodeUri')
  }

  public get targetAddress() {
    return this.config?.targetAddress
  }

  public get targetAddressString() {
    return this.targetAddress ?? ''
  }

  static override async create(params: XyoHttpBridgeParams): Promise<XyoHttpBridge> {
    return (await super.create(params)) as XyoHttpBridge
  }

  connect(): Promisable<boolean> {
    return true
  }

  disconnect(): Promisable<boolean> {
    return true
  }

  override async query<T extends XyoQueryBoundWitness = XyoQueryBoundWitness>(query: T, payloads?: XyoPayload[]): Promise<ModuleQueryResult> {
    const wrapper = QueryBoundWitnessWrapper.parseQuery<XyoBridgeQuery>(query, payloads)
    const typedQuery = wrapper.query.payload
    const queryAccount = new Account()
    const resultPayloads: XyoPayload[] = []
    try {
      switch (typedQuery.schema) {
        case XyoBridgeConnectQuerySchema: {
          await this.connect()
          break
        }
        case XyoBridgeDisconnectQuerySchema: {
          await this.disconnect()
          break
        }
        default:
          if (super.queries.find((schema) => schema === typedQuery.schema)) {
            return super.query(query, payloads)
          } else {
            return this.forward(query, payloads)
          }
      }
    } catch (ex) {
      const error = ex as Error
      resultPayloads.push(new XyoErrorBuilder([wrapper.hash], error.message).build())
    }
    return this.bindResult(resultPayloads, queryAccount)
  }

  protected async forward(query: XyoQuery, payloads?: XyoPayload[]): Promise<ModuleQueryResult> {
    try {
      const boundQuery = this.bindQuery(query, payloads)
      const result = await this.axios.post<ModuleQueryResult>(`${this.nodeUri}/${this.address}`, [boundQuery, ...[query]])
      return result.data
    } catch (ex) {
      const error = ex as AxiosError
      console.log(`Error Status: ${error.status}`)
      console.log(`Error Cause: ${JSON.stringify(error.cause, null, 2)}`)
      throw error
    }
  }
}

export class XyoHttpBridge<TConfig extends HttpBridgeConfig = HttpBridgeConfig> extends HttpBridge<TConfig> {}
