import { assertEx } from '@xylabs/assert'
import { fulfilled } from '@xylabs/promise'
import { XyoDivinerDivineQuerySchema } from '@xyo-network/diviner-model'
import { Huri } from '@xyo-network/huri'
import { ModuleParams } from '@xyo-network/module'
import { XyoPayload } from '@xyo-network/payload-model'
import { compact } from 'lodash-es'

import { AbstractPayloadDiviner } from '../AbstractPayloadDiviner'
import { XyoHuriPayload, XyoHuriSchema } from '../XyoHuriPayload'
import { XyoHuriPayloadDivinerConfig, XyoHuriPayloadDivinerConfigSchema } from './Config'

export class HuriPayloadDiviner extends AbstractPayloadDiviner<XyoHuriPayloadDivinerConfig> {
  static override configSchema: XyoHuriPayloadDivinerConfigSchema

  protected get options() {
    return this.config?.options
  }

  static override async create(params?: Partial<ModuleParams<XyoHuriPayloadDivinerConfig>>): Promise<HuriPayloadDiviner> {
    return (await super.create(params)) as HuriPayloadDiviner
  }

  override async divine(payloads?: XyoPayload[]): Promise<XyoPayload[]> {
    const huriPayloads = assertEx(
      payloads?.filter((payload): payload is XyoHuriPayload => payload?.schema === XyoHuriSchema),
      `no huri payloads provided: ${JSON.stringify(payloads, null, 2)}`,
    )
    const huriList = huriPayloads
      .map((huriPayload, index) => huriPayload.huri.map((huri) => new Huri(huri, { token: huriPayload.tokens?.[index] })))
      .flat()

    const settled = await Promise.allSettled(huriList.map((huri) => huri.fetch()))
    return compact(settled.filter(fulfilled).map((settle) => settle.value))
  }

  override queries() {
    return [XyoDivinerDivineQuerySchema, ...super.queries()]
  }
}
