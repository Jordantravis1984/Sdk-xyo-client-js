import { AnyConfigSchema } from '@xyo-network/module'
import { defaultSystemInfoConfig, XyoNodeSystemInfoSchema } from '@xyo-network/node-system-info-payload-plugin'
import { Payload } from '@xyo-network/payload-model'
import { AbstractWitness, WitnessModule, WitnessParams } from '@xyo-network/witness'
import { get } from 'systeminformation'

import { XyoNodeSystemInfoWitnessConfig, XyoNodeSystemInfoWitnessConfigSchema } from './Config'

export type XyoNodeSystemInfoWitnessParams = WitnessParams<AnyConfigSchema<XyoNodeSystemInfoWitnessConfig>>

export class XyoNodeSystemInfoWitness<TParams extends XyoNodeSystemInfoWitnessParams = XyoNodeSystemInfoWitnessParams>
  extends AbstractWitness<TParams>
  implements WitnessModule
{
  static override configSchema = XyoNodeSystemInfoWitnessConfigSchema

  override async observe(payloads?: Payload[]) {
    const node = await get(this.config?.nodeValues ?? defaultSystemInfoConfig())
    return await super.observe([{ ...node, ...payloads?.[0], schema: XyoNodeSystemInfoSchema }])
  }
}
