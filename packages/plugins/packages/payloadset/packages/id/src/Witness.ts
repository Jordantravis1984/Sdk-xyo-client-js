import { IdPayload, IdSchema } from '@xyo-network/id-payload-plugin'
import { AnyConfigSchema } from '@xyo-network/module'
import { XyoPayload } from '@xyo-network/payload-model'
import { AbstractWitness, WitnessParams, XyoWitnessConfig } from '@xyo-network/witness'

export type IdWitnessConfigSchema = 'network.xyo.id.witness.config'
export const IdWitnessConfigSchema: IdWitnessConfigSchema = 'network.xyo.id.witness.config'

export type IdWitnessConfig = XyoWitnessConfig<{
  salt?: string
  schema: IdWitnessConfigSchema
}>

export type IdWitnessParams = WitnessParams<AnyConfigSchema<IdWitnessConfig>>

export class IdWitness<TParams extends IdWitnessParams = IdWitnessParams> extends AbstractWitness<TParams> {
  static override configSchema = IdWitnessConfigSchema

  get salt() {
    return this.config?.salt ?? `${Math.floor(Math.random() * 9999999)}`
  }

  static override async create<TParams extends IdWitnessParams>(params?: TParams) {
    return (await super.create(params)) as IdWitness<TParams>
  }

  override async observe(payloads: XyoPayload[] = []): Promise<XyoPayload[]> {
    return await super.observe(
      payloads.length > 0
        ? (payloads as IdPayload[]).map((fieldItems) => {
            return {
              salt: fieldItems?.salt ?? this.salt,
              schema: IdSchema,
            }
          })
        : [
            {
              salt: this.salt,
              schema: IdSchema,
            },
          ],
    )
  }
}
