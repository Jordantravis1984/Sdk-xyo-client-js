import { IdPayload, IdSchema } from '@xyo-network/id-payload-plugin'
import { AnyConfigSchema } from '@xyo-network/module'
import { Payload } from '@xyo-network/payload-model'
import { AbstractWitness, WitnessConfig, WitnessParams } from '@xyo-network/witness'

export type IdWitnessConfigSchema = 'network.xyo.id.witness.config'
export const IdWitnessConfigSchema: IdWitnessConfigSchema = 'network.xyo.id.witness.config'

export type IdWitnessConfig = WitnessConfig<{
  salt?: string
  schema: IdWitnessConfigSchema
}>

export type IdWitnessParams = WitnessParams<AnyConfigSchema<IdWitnessConfig>>

export class IdWitness<TParams extends IdWitnessParams = IdWitnessParams> extends AbstractWitness<TParams> {
  static override configSchema = IdWitnessConfigSchema

  get salt() {
    return this.config?.salt ?? `${Math.floor(Math.random() * 9999999)}`
  }

  override async observe(payloads: Payload[] = []): Promise<Payload[]> {
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
