import { assertEx } from '@xylabs/assert'
import { Account } from '@xyo-network/account'
import {
  DivinerConfigSchema,
  DivinerDivineQuerySchema,
  DivinerModule,
  DivinerModuleEventData,
  DivinerParams,
  DivinerQuery,
  DivinerQueryBase,
} from '@xyo-network/diviner-model'
import { AbstractModule, ModuleConfig, ModuleErrorBuilder, ModuleQueryResult, QueryBoundWitness, QueryBoundWitnessWrapper } from '@xyo-network/module'
import { Payload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { Promisable } from '@xyo-network/promise'

export abstract class AbstractDiviner<
    TParams extends DivinerParams = DivinerParams,
    TEventData extends DivinerModuleEventData = DivinerModuleEventData,
  >
  extends AbstractModule<TParams, TEventData>
  implements DivinerModule<TParams>
{
  static override configSchema: string = DivinerConfigSchema
  static targetSchema: string

  override get queries(): string[] {
    return [DivinerDivineQuerySchema, ...super.queries]
  }

  protected override get _queryAccountPaths(): Record<DivinerQueryBase['schema'], string> {
    return {
      'network.xyo.query.diviner.divine': '1/1',
    }
  }

  protected override async queryHandler<T extends QueryBoundWitness = QueryBoundWitness, TConfig extends ModuleConfig = ModuleConfig>(
    query: T,
    payloads?: Payload[],
    queryConfig?: TConfig,
  ): Promise<ModuleQueryResult> {
    const wrapper = QueryBoundWitnessWrapper.parseQuery<DivinerQuery>(query, payloads)
    //remove the query payload
    const cleanPayloads = payloads?.filter((payload) => PayloadWrapper.hash(payload) !== query.query)
    const typedQuery = wrapper.query
    assertEx(this.queryable(query, payloads, queryConfig))
    const queryAccount = new Account()
    const resultPayloads: Payload[] = []
    try {
      switch (typedQuery.schemaName) {
        case DivinerDivineQuerySchema:
          await this.emit('reportStart', { inPayloads: payloads, module: this })
          resultPayloads.push(...(await this.divine(cleanPayloads)))
          await this.emit('reportEnd', { inPayloads: payloads, module: this, outPayloads: resultPayloads })
          break
        default:
          return super.queryHandler(query, payloads)
      }
    } catch (ex) {
      const error = ex as Error
      resultPayloads.push(new ModuleErrorBuilder().sources([wrapper.hash]).message(error.message).build())
    }
    return await this.bindQueryResult(typedQuery, resultPayloads, [queryAccount])
  }

  abstract divine(payloads?: Payload[]): Promisable<Payload[]>
}
