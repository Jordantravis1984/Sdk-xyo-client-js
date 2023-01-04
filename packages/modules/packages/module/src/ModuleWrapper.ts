import { Account } from '@xyo-network/account'
import {
  AbstractModuleDiscoverQuery,
  AbstractModuleDiscoverQuerySchema,
  Module,
  ModuleDescription,
  ModuleQueryResult,
  ModuleResolver,
  XyoQuery,
  XyoQueryBoundWitness,
} from '@xyo-network/module-model'
import { XyoPayload, XyoPayloads } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { Promisable, PromiseEx } from '@xyo-network/promise'

import { XyoError, XyoErrorSchema } from './Error'
import { QueryBoundWitnessBuilder, QueryBoundWitnessWrapper } from './Query'

export interface WrapperError extends Error {
  errors: (XyoError | null)[]
  query: [XyoQueryBoundWitness, XyoPayloads]
  result: ModuleQueryResult
}

export interface WrapperConstructor<TModule extends Module = Module, TWrapper extends ModuleWrapper<TModule> = ModuleWrapper<TModule>> {
  new (mod: TModule): TWrapper
}

function wrapperStatic() {
  return <U extends WrapperConstructor>(constructor: U) => {
    constructor
  }
}

@wrapperStatic()
export class ModuleWrapper<TModule extends Module = Module> implements Module {
  protected module: TModule

  constructor(module: TModule) {
    this.module = module
  }

  get address() {
    return this.module.address
  }
  get config(): XyoPayload {
    return this.module.config
  }
  get resolver(): ModuleResolver | undefined {
    return undefined
  }
  public description(): Promisable<ModuleDescription> {
    return this.module.description()
  }

  discover(): Promise<XyoPayload[]> {
    const queryPayload = PayloadWrapper.parse<AbstractModuleDiscoverQuery>({ schema: AbstractModuleDiscoverQuerySchema })
    return this.sendQuery(queryPayload)
  }

  queries(): string[] {
    return this.module.queries()
  }

  async query<T extends XyoQueryBoundWitness = XyoQueryBoundWitness>(query: T, payloads?: XyoPayload[]): Promise<ModuleQueryResult> {
    return await this.module.query(query, payloads)
  }

  queryable(schema: string, addresses?: string[]) {
    return this.module.queryable(schema, addresses)
  }

  protected bindQuery<T extends XyoQuery | PayloadWrapper<XyoQuery>>(
    query: T,
    payloads?: XyoPayload[],
    account?: Account,
  ): PromiseEx<[XyoQueryBoundWitness, XyoPayload[]], Account> {
    const promise = new PromiseEx<[XyoQueryBoundWitness, XyoPayload[]], Account>((resolve) => {
      const result = this.bindQueryInternal(query, payloads, account)
      resolve?.(result)
      return result
    }, account)
    return promise
  }

  protected bindQueryInternal<T extends XyoQuery | PayloadWrapper<XyoQuery>>(
    query: T,
    payloads?: XyoPayload[],
    account?: Account,
  ): [XyoQueryBoundWitness, XyoPayload[]] {
    const builder = new QueryBoundWitnessBuilder().payloads(payloads).query(query)
    const result = (account ? builder.witness(account) : builder).build()
    return result
  }

  protected filterErrors(query: [XyoQueryBoundWitness, XyoPayloads], result: ModuleQueryResult): (XyoError | null)[] {
    return (result[1]?.filter((payload) => {
      if (payload?.schema === XyoErrorSchema) {
        const wrapper = new QueryBoundWitnessWrapper(query[0])
        return payload.sources?.includes(wrapper.hash)
      }
      return false
    }) ?? []) as XyoError[]
  }

  protected async sendQuery<T extends XyoQuery | PayloadWrapper<XyoQuery>>(queryPayload: T, payloads?: XyoPayloads): Promise<XyoPayload[]> {
    const query = await this.bindQuery(queryPayload, payloads)
    const result = await this.module.query(query[0], query[1])
    this.throwErrors(query, result)
    return result[1]
  }

  protected throwErrors(query: [XyoQueryBoundWitness, XyoPayloads], result: ModuleQueryResult) {
    const errors = this.filterErrors(query, result)
    if (errors?.length > 0) {
      const error: WrapperError = {
        errors,
        message: errors.reduce((message, error) => `${message}${message.length > 0 ? '|' : ''}${error?.message}`, ''),
        name: 'XyoError',
        query,
        result,
      }
      throw error
    }
  }
}
