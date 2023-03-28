import { assertEx } from '@xylabs/assert'
import { fulfilled, rejected } from '@xylabs/promise'
import { AddressPayload, AddressSchema } from '@xyo-network/address-payload-plugin'
import { WithAdditional } from '@xyo-network/core'
import { AbstractDiviner, AddressSpaceDiviner, DivinerConfig, DivinerParams, DivinerWrapper } from '@xyo-network/diviner'
import { AnyConfigSchema } from '@xyo-network/module'
import {
  isPayloadStatsQueryPayload,
  PayloadStatsDiviner,
  PayloadStatsPayload,
  PayloadStatsQueryPayload,
  PayloadStatsSchema,
  PayloadWithMeta,
} from '@xyo-network/node-core-model'
import { PayloadBuilder } from '@xyo-network/payload-builder'
import { Payload } from '@xyo-network/payload-model'
import { BaseMongoSdk, MongoClientWrapper } from '@xyo-network/sdk-xyo-mongo-js'
import { Job, JobProvider } from '@xyo-network/shared'
import { ChangeStream, ChangeStreamInsertDocument, ChangeStreamOptions, ResumeToken, UpdateOptions } from 'mongodb'

import { COLLECTIONS } from '../../collections'
import { DATABASES } from '../../databases'
import { BatchSetIterator } from '../../Util'

const updateOptions: UpdateOptions = { upsert: true }

interface Stats {
  archive: string
  payloads?: {
    count?: number
  }
}

export type MongoDBPayloadStatsDivinerConfigSchema = 'network.xyo.module.config.diviner.stats.payload'
export const MongoDBPayloadStatsDivinerConfigSchema: MongoDBPayloadStatsDivinerConfigSchema = 'network.xyo.module.config.diviner.stats.payload'

export type MongoDBPayloadStatsDivinerConfig<T extends Payload = Payload> = DivinerConfig<
  WithAdditional<
    Payload,
    T & {
      schema: MongoDBPayloadStatsDivinerConfigSchema
    }
  >
>

export type MongoDBPayloadStatsDivinerParams<T extends Payload = Payload> = DivinerParams<
  AnyConfigSchema<MongoDBPayloadStatsDivinerConfig<T>>,
  {
    addressSpaceDiviner: AddressSpaceDiviner
    payloadSdk: BaseMongoSdk<PayloadWithMeta>
  }
>

export class MongoDBPayloadStatsDiviner<TParams extends MongoDBPayloadStatsDivinerParams = MongoDBPayloadStatsDivinerParams>
  extends AbstractDiviner<TParams>
  implements PayloadStatsDiviner, JobProvider
{
  static override configSchema = MongoDBPayloadStatsDivinerConfigSchema

  protected readonly batchLimit = 100
  // Lint rule required to allow for use of batchLimit constant
  // eslint-disable-next-line @typescript-eslint/member-ordering
  protected readonly batchIterator: BatchSetIterator<string> = new BatchSetIterator([], this.batchLimit)
  protected changeStream: ChangeStream | undefined = undefined
  protected pendingCounts: Record<string, number> = {}
  protected resumeAfter: ResumeToken | undefined = undefined

  get jobs(): Job[] {
    return [
      {
        name: 'MongoDBPayloadStatsDiviner.UpdateChanges',
        onSuccess: () => {
          this.pendingCounts = {}
        },
        schedule: '1 minute',
        task: async () => await this.updateChanges(),
      },
      {
        name: 'MongoDBPayloadStatsDiviner.DivineAddressesBatch',
        schedule: '5 minute',
        task: async () => await this.divineAddressesBatch(),
      },
    ]
  }

  async divine(payloads?: Payload[]): Promise<Payload<PayloadStatsPayload>[]> {
    const query = payloads?.find<PayloadStatsQueryPayload>(isPayloadStatsQueryPayload)
    const addresses = query?.address ? (Array.isArray(query?.address) ? query.address : [query.address]) : undefined
    const counts = addresses ? await Promise.all(addresses.map((address) => this.divineAddress(address))) : [await this.divineAllAddresses()]
    return counts.map((count) => new PayloadBuilder<PayloadStatsPayload>({ schema: PayloadStatsSchema }).fields({ count }).build())
  }

  override async start() {
    await super.start()
    await this.registerWithChangeStream()
  }

  protected override async stop(): Promise<this> {
    await this.changeStream?.close()
    return await super.stop()
  }

  private divineAddress = async (address: string) => {
    const stats = await this.params.payloadSdk.useMongo(async (mongo) => {
      return await mongo.db(DATABASES.Archivist).collection<Stats>(COLLECTIONS.ArchivistStats).findOne({ archive: address })
    })
    const remote = stats?.payloads?.count || 0
    const local = this.pendingCounts[address] || 0
    return remote + local
  }

  private divineAddressFull = async (address: string) => {
    const count = await this.params.payloadSdk.useCollection((collection) => collection.countDocuments({ _archive: address }))
    await this.storeDivinedResult(address, count)
    return count
  }

  private divineAddressesBatch = async () => {
    this.logger?.log(`MongoDBPayloadStatsDiviner.DivineAddressesBatch: Divining - Limit: ${this.batchLimit}`)
    const addressSpaceDiviner = assertEx(
      this.params.addressSpaceDiviner,
      'MongoDBPayloadStatsDiviner.DivineAddressesBatch: Missing AddressSpaceDiviner',
    )
    const result = (await new DivinerWrapper({ module: addressSpaceDiviner }).divine([])) || []
    const addresses = result.filter<AddressPayload>((x): x is AddressPayload => x.schema === AddressSchema).map((x) => x.address)
    this.logger?.log(`MongoDBPayloadStatsDiviner.DivineAddressesBatch: Updating with ${addresses.length} Addresses`)
    this.batchIterator.addValues(addresses)
    const results = await Promise.allSettled(this.batchIterator.next().value.map(this.divineAddressFull))
    const succeeded = results.filter(fulfilled).length
    const failed = results.filter(rejected).length
    this.logger?.log(`MongoDBPayloadStatsDiviner.DivineAddressesBatch: Divined - Succeeded: ${succeeded} Failed: ${failed}`)
  }

  private divineAllAddresses = () => this.params.payloadSdk.useCollection((collection) => collection.estimatedDocumentCount())

  private processChange = (change: ChangeStreamInsertDocument<PayloadWithMeta>) => {
    this.resumeAfter = change._id
    const address = change.fullDocument._archive
    if (address) this.pendingCounts[address] = (this.pendingCounts[address] || 0) + 1
  }

  private registerWithChangeStream = async () => {
    this.logger?.log('MongoDBPayloadStatsDiviner.RegisterWithChangeStream: Registering')
    const wrapper = MongoClientWrapper.get(this.params.payloadSdk.uri, this.params.payloadSdk.config.maxPoolSize)
    const connection = await wrapper.connect()
    assertEx(connection, 'Connection failed')
    const collection = connection.db(DATABASES.Archivist).collection(COLLECTIONS.Payloads)
    const opts: ChangeStreamOptions = this.resumeAfter ? { resumeAfter: this.resumeAfter } : {}
    this.changeStream = collection.watch([], opts)
    this.changeStream.on('change', this.processChange)
    this.changeStream.on('error', this.registerWithChangeStream)
    this.logger?.log('MongoDBPayloadStatsDiviner.RegisterWithChangeStream: Registered')
  }

  private storeDivinedResult = async (address: string, count: number) => {
    await this.params.payloadSdk.useMongo(async (mongo) => {
      await mongo
        .db(DATABASES.Archivist)
        .collection(COLLECTIONS.ArchivistStats)
        .updateOne({ archive: address }, { $set: { [`${COLLECTIONS.Payloads}.count`]: count } }, updateOptions)
    })
    this.pendingCounts[address] = 0
  }

  private updateChanges = async () => {
    this.logger?.log('MongoDBPayloadStatsDiviner.UpdateChanges: Updating')
    const updates = Object.keys(this.pendingCounts).map((address) => {
      const count = this.pendingCounts[address]
      this.pendingCounts[address] = 0
      const $inc = { [`${COLLECTIONS.Payloads}.count`]: count }
      return this.params.payloadSdk.useMongo(async (mongo) => {
        await mongo.db(DATABASES.Archivist).collection(COLLECTIONS.ArchivistStats).updateOne({ archive: address }, { $inc }, updateOptions)
      })
    })
    const results = await Promise.allSettled(updates)
    const succeeded = results.filter(fulfilled).length
    const failed = results.filter(rejected).length
    this.logger?.log(`MongoDBPayloadStatsDiviner.UpdateChanges: Updated - Succeeded: ${succeeded} Failed: ${failed}`)
  }
}
