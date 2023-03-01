import { assertEx } from '@xylabs/assert'
import { Account } from '@xyo-network/account'
import { Diviner, DivinerModule, XyoDivinerDivineQuery, XyoDivinerDivineQuerySchema } from '@xyo-network/diviner-model'
import { ModuleWrapper } from '@xyo-network/module'
import { Module } from '@xyo-network/module-model'
import { XyoPayload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'

export class DivinerWrapper extends ModuleWrapper implements Diviner {
  static override requiredQueries = [XyoDivinerDivineQuerySchema, ...super.requiredQueries]

  constructor(module: Module, account?: Account) {
    super(module, account)
    assertEx(module.queries.includes(XyoDivinerDivineQuerySchema))
  }

  static override tryWrap(module?: Module, account?: Account): DivinerWrapper | undefined {
    if (module) {
      const missingRequiredQueries = this.missingRequiredQueries(module)
      if (missingRequiredQueries.length > 0) {
        console.warn(`Missing queries: ${JSON.stringify(missingRequiredQueries, null, 2)}`)
      } else {
        return new DivinerWrapper(module as DivinerModule, account)
      }
    }
  }

  static override wrap(module?: Module, account?: Account): DivinerWrapper {
    return assertEx(this.tryWrap(module, account), 'Unable to wrap module as DivinerWrapper')
  }

  async divine(payloads?: XyoPayload[]): Promise<XyoPayload[]> {
    const queryPayload = PayloadWrapper.parse<XyoDivinerDivineQuery>({ schema: XyoDivinerDivineQuerySchema })
    const result = await this.sendQuery(queryPayload, payloads)
    return result
  }
}
