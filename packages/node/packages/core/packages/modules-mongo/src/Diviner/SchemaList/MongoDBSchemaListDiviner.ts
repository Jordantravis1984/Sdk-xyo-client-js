import { DivinerParams } from '@xyo-network/diviner-model'
import { SchemaListDiviner } from '@xyo-network/diviner-schema-list-abstract'
import {
  isSchemaListQueryPayload,
  SchemaListDivinerConfig,
  SchemaListDivinerConfigSchema,
  SchemaListDivinerSchema,
  SchemaListPayload,
  SchemaListQueryPayload,
} from '@xyo-network/diviner-schema-list-model'
import { AnyConfigSchema } from '@xyo-network/module'
import { BoundWitnessWithMeta } from '@xyo-network/node-core-model'
import { PayloadBuilder } from '@xyo-network/payload-builder'
import { Payload } from '@xyo-network/payload-model'
import { BaseMongoSdk } from '@xyo-network/sdk-xyo-mongo-js'

export type MongoDBSchemaListDivinerParams = DivinerParams<
  AnyConfigSchema<SchemaListDivinerConfig>,
  {
    boundWitnessSdk: BaseMongoSdk<BoundWitnessWithMeta>
  }
>

export class MongoDBSchemaListDiviner<
  TParams extends MongoDBSchemaListDivinerParams = MongoDBSchemaListDivinerParams,
> extends SchemaListDiviner<TParams> {
  static override configSchema = SchemaListDivinerConfigSchema

  /**
   * The amount of time to allow the aggregate query to execute
   */
  protected readonly aggregateTimeoutMs = 10_000

  override async divine(payloads?: Payload[]): Promise<Payload<SchemaListPayload>[]> {
    const query = payloads?.find<SchemaListQueryPayload>(isSchemaListQueryPayload)
    const addresses = query?.address ? (Array.isArray(query?.address) ? query.address : [query.address]) : undefined
    const counts = addresses ? await Promise.all(addresses.map((address) => this.divineAddress(address))) : [await this.divineAllAddresses()]
    return counts.map((schemas) => new PayloadBuilder<SchemaListPayload>({ schema: SchemaListDivinerSchema }).fields({ schemas }).build())
  }

  override async start() {
    await super.start()
  }

  protected override async stop(): Promise<this> {
    return await super.stop()
  }

  private divineAddress = async (archive: string): Promise<string[]> => {
    const result = await this.params.boundWitnessSdk.useCollection((collection) => {
      return collection.distinct('payload_schemas', { addresses: { $in: [archive] } })
    })
    return result
  }

  private divineAllAddresses = async (): Promise<string[]> => {
    const result = await this.params.boundWitnessSdk.useCollection((collection) => {
      return collection.distinct('payload_schemas')
    })
    return result
  }
}
