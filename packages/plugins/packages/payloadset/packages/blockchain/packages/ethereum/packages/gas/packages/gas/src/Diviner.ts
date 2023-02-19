import { AbstractDiviner, DivinerConfig } from '@xyo-network/diviner'
import { XyoEthereumGasSchema } from '@xyo-network/gas-price-payload-plugin'
import { ModuleParams } from '@xyo-network/module'
import { XyoPayloads } from '@xyo-network/payload-model'
import { Promisable } from '@xyo-network/promise'

import { divineGas } from './lib'
import { XyoEthereumGasDivinerConfigSchema } from './Schema'

export type XyoEthereumGasDivinerConfig = DivinerConfig<{ schema: XyoEthereumGasDivinerConfigSchema }>

export class XyoEthereumGasDiviner extends AbstractDiviner {
  static override configSchema = XyoEthereumGasDivinerConfigSchema
  static override targetSchema = XyoEthereumGasSchema

  static override async create(params?: ModuleParams<XyoEthereumGasDivinerConfig>) {
    return (await super.create(params)) as XyoEthereumGasDiviner
  }

  public override divine(payloads: XyoPayloads): Promisable<XyoPayloads> {
    const cost = divineGas(payloads)
    return [cost]
  }
}
