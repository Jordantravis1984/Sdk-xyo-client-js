import { ModuleWrapper } from '@xyo-network/module'
import { PayloadWrapper, XyoPayload } from '@xyo-network/payload'

import { Diviner } from './Diviner'
import { XyoDivinerDivineQuery, XyoDivinerDivineQuerySchema } from './Queries'

export class DivinerWrapper extends ModuleWrapper implements Diviner {
  async divine(payloads?: XyoPayload[]): Promise<XyoPayload[]> {
    const queryPayload = PayloadWrapper.parse<XyoDivinerDivineQuery>({ schema: XyoDivinerDivineQuerySchema })
    const query = await this.bindQuery(queryPayload, payloads)
    const result = await this.module.query(query[0], query[1])
    this.throwErrors(query, result)
    return result[1]
  }
}

/** @deprecated use DivinerWrapper instead */
export class XyoDivinerWrapper extends DivinerWrapper {}