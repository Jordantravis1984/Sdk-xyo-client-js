import { assertEx } from '@xylabs/assert'
import { Account } from '@xyo-network/account'
import { DivinerConfig, DivinerModule, XyoDivinerDivineQuerySchema, XyoDivinerQuery } from '@xyo-network/diviner-model'
import { AbstractModule, ModuleParams, ModuleQueryResult, QueryBoundWitnessWrapper, XyoErrorBuilder, XyoQueryBoundWitness } from '@xyo-network/module'
import { XyoPayload } from '@xyo-network/payload-model'
import { Promisable } from '@xyo-network/promise'

export type DivinerParams = ModuleParams

export abstract class AbstractDiviner<TConfig extends DivinerConfig = DivinerConfig> extends AbstractModule<TConfig> implements DivinerModule {
  static override configSchema: string
  static targetSchema: string

  public get targetSchema() {
    return this.config?.targetSchema
  }

  static override async create(params?: Partial<ModuleParams<DivinerConfig>>): Promise<AbstractDiviner> {
    return (await super.create(params)) as AbstractDiviner
  }

  public override queries(): string[] {
    return [XyoDivinerDivineQuerySchema, ...super.queries()]
  }

  override async query<T extends XyoQueryBoundWitness = XyoQueryBoundWitness>(
    query: T,
    payloads?: XyoPayload[],
  ): Promise<ModuleQueryResult<XyoPayload>> {
    const wrapper = QueryBoundWitnessWrapper.parseQuery<XyoDivinerQuery>(query, payloads)
    const typedQuery = wrapper.query
    assertEx(await this.queryable(query, payloads))

    const queryAccount = new Account()

    const resultPayloads: XyoPayload[] = []
    try {
      switch (typedQuery.schemaName) {
        case XyoDivinerDivineQuerySchema:
          resultPayloads.push(...(await this.divine(payloads)))
          break
        default:
          return super.query(query, payloads)
      }
    } catch (ex) {
      const error = ex as Error
      resultPayloads.push(new XyoErrorBuilder([wrapper.hash], error.message).build())
    }
    return await this.bindResult(resultPayloads, queryAccount)
  }

  abstract divine(payloads?: XyoPayload[]): Promisable<XyoPayload[]>
}
