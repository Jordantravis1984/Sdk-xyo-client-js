import { assertEx } from '@xylabs/assert'
import { fulfilled, rejected } from '@xylabs/promise'
import { AddressPayload, AddressSchema } from '@xyo-network/address-payload-plugin'
import { WithAdditional } from '@xyo-network/core'
import { AbstractDiviner, AddressSpaceDiviner, DivinerConfig, DivinerWrapper } from '@xyo-network/diviner'
import { AnyConfigSchema, ModuleParams } from '@xyo-network/module'
import {
  BoundWitnessStatsDiviner,
  BoundWitnessStatsPayload,
  BoundWitnessStatsQueryPayload,
  BoundWitnessStatsSchema,
  BoundWitnessWithMeta,
  isBoundWitnessStatsQueryPayload,
} from '@xyo-network/node-core-model'
import { PayloadBuilder } from '@xyo-network/payload-builder'
import { Payload } from '@xyo-network/payload-model'
import { BaseMongoSdk, MongoClientWrapper } from '@xyo-network/sdk-xyo-mongo-js'
import { Job, JobProvider } from '@xyo-network/shared'
import { ChangeStream, ChangeStreamInsertDocument, ChangeStreamOptions, ResumeToken, UpdateOptions } from 'mongodb'

import { COLLECTIONS } from '../../collections'
import { DATABASES } from '../../databases'

const updateOptions: UpdateOptions = { upsert: true }

interface Stats {
  archive: string
  bound_witnesses?: {
    count?: number
  }
}

export type MongoDBBoundWitnessStatsDivinerConfigSchema = 'network.xyo.module.config.diviner.stats.boundwitness'
export const MongoDBBoundWitnessStatsDivinerConfigSchema: MongoDBBoundWitnessStatsDivinerConfigSchema =
  'network.xyo.module.config.diviner.stats.boundwitness'

export type MongoDBBoundWitnessStatsDivinerConfig<T extends Payload = Payload> = DivinerConfig<
  WithAdditional<
    Payload,
    T & {
      schema: MongoDBBoundWitnessStatsDivinerConfigSchema
    }
  >
>
export type MongoDBBoundWitnessStatsDivinerParams<T extends Payload = Payload> = ModuleParams<
  AnyConfigSchema<MongoDBBoundWitnessStatsDivinerConfig<T>>,
  {
    addressSpaceDiviner: AddressSpaceDiviner
    boundWitnessSdk: BaseMongoSdk<BoundWitnessWithMeta>
  }
>

export class MongoDBBoundWitnessStatsDiviner<TParams extends MongoDBBoundWitnessStatsDivinerParams = MongoDBBoundWitnessStatsDivinerParams>
  extends AbstractDiviner<TParams>
  implements BoundWitnessStatsDiviner, JobProvider
{
  static override configSchema = MongoDBBoundWitnessStatsDivinerConfigSchema

  protected readonly batchLimit = 100
  protected changeStream: ChangeStream | undefined = undefined
  protected nextOffset = 0
  protected pendingCounts: Record<string, number> = {}
  protected resumeAfter: ResumeToken | undefined = undefined

  get jobs(): Job[] {
    return [
      {
        name: 'MongoDBBoundWitnessStatsDiviner.UpdateChanges',
        onSuccess: () => {
          this.pendingCounts = {}
        },
        schedule: '1 minute',
        task: async () => await this.updateChanges(),
      },
      {
        name: 'MongoDBBoundWitnessStatsDiviner.DivineAddressesBatch',
        schedule: '10 minute',
        task: async () => await this.divineAddressesBatch(),
      },
    ]
  }

  protected get sdk() {
    return this.params.boundWitnessSdk
  }

  override async divine(payloads?: Payload[]): Promise<Payload<BoundWitnessStatsPayload>[]> {
    const query = payloads?.find<BoundWitnessStatsQueryPayload>(isBoundWitnessStatsQueryPayload)
    const addresses = query?.address ? (Array.isArray(query?.address) ? query.address : [query.address]) : undefined
    const counts = addresses ? await Promise.all(addresses.map((address) => this.divineAddress(address))) : [await this.divineAllAddresses()]
    return counts.map((count) => new PayloadBuilder<BoundWitnessStatsPayload>({ schema: BoundWitnessStatsSchema }).fields({ count }).build())
  }

  override async start() {
    await super.start()
    await this.registerWithChangeStream()
  }

  protected override async stop(): Promise<this> {
    await this.changeStream?.close()
    return await super.stop()
  }

  private divineAddress = async (archive: string) => {
    const stats = await this.sdk.useMongo(async (mongo) => {
      return await mongo.db(DATABASES.Archivist).collection<Stats>(COLLECTIONS.ArchivistStats).findOne({ archive })
    })
    const remote = stats?.bound_witnesses?.count || 0
    const local = this.pendingCounts[archive] || 0
    return remote + local
  }

  private divineAddressFull = async (archive: string) => {
    const count = await this.sdk.useCollection((collection) => collection.countDocuments({ _archive: archive }))
    await this.storeDivinedResult(archive, count)
    return count
  }

  private divineAddressesBatch = async () => {
    this.logger?.log(`MongoDBBoundWitnessStatsDiviner.DivineAddressesBatch: Divining - Limit: ${this.batchLimit} Offset: ${this.nextOffset}`)
    const addressSpaceDiviner = assertEx(
      this.params.addressSpaceDiviner,
      'MongoDBBoundWitnessStatsDiviner.DivineAddressesBatch: Missing AddressSpaceDiviner',
    )
    const result = (await new DivinerWrapper({ module: addressSpaceDiviner }).divine([])) || []
    const addresses = result.filter<AddressPayload>((x): x is AddressPayload => x.schema === AddressSchema).map((x) => x.address)
    this.logger?.log(`MongoDBBoundWitnessStatsDiviner.DivineAddressesBatch: Divining ${addresses.length} Addresses`)
    this.nextOffset = addresses.length < this.batchLimit ? 0 : this.nextOffset + this.batchLimit
    const results = await Promise.allSettled(addresses.map(this.divineAddressFull))
    const succeeded = results.filter(fulfilled).length
    const failed = results.filter(rejected).length
    this.logger?.log(`MongoDBBoundWitnessStatsDiviner.DivineAddressesBatch: Divined - Succeeded: ${succeeded} Failed: ${failed}`)
  }

  private divineAllAddresses = () => this.sdk.useCollection((collection) => collection.estimatedDocumentCount())

  private processChange = (change: ChangeStreamInsertDocument<BoundWitnessWithMeta>) => {
    this.resumeAfter = change._id
    const archive = change.fullDocument._archive
    if (archive) this.pendingCounts[archive] = (this.pendingCounts[archive] || 0) + 1
  }

  private registerWithChangeStream = async () => {
    this.logger?.log('MongoDBBoundWitnessStatsDiviner.RegisterWithChangeStream: Registering')
    const wrapper = MongoClientWrapper.get(this.sdk.uri, this.sdk.config.maxPoolSize)
    const connection = await wrapper.connect()
    assertEx(connection, 'Connection failed')
    const collection = connection.db(DATABASES.Archivist).collection(COLLECTIONS.BoundWitnesses)
    const opts: ChangeStreamOptions = this.resumeAfter ? { resumeAfter: this.resumeAfter } : {}
    this.changeStream = collection.watch([], opts)
    this.changeStream.on('change', this.processChange)
    this.changeStream.on('error', this.registerWithChangeStream)
    this.logger?.log('MongoDBBoundWitnessStatsDiviner.RegisterWithChangeStream: Registered')
  }

  private storeDivinedResult = async (archive: string, count: number) => {
    await this.sdk.useMongo(async (mongo) => {
      await mongo
        .db(DATABASES.Archivist)
        .collection(COLLECTIONS.ArchivistStats)
        .updateOne({ archive }, { $set: { [`${COLLECTIONS.BoundWitnesses}.count`]: count } }, updateOptions)
    })
    this.pendingCounts[archive] = 0
  }

  private updateChanges = async () => {
    this.logger?.log('MongoDBBoundWitnessStatsDiviner.UpdateChanges: Updating')
    const updates = Object.keys(this.pendingCounts).map((archive) => {
      const count = this.pendingCounts[archive]
      this.pendingCounts[archive] = 0
      const $inc = { [`${COLLECTIONS.BoundWitnesses}.count`]: count }
      return this.sdk.useMongo(async (mongo) => {
        await mongo.db(DATABASES.Archivist).collection(COLLECTIONS.ArchivistStats).updateOne({ archive }, { $inc }, updateOptions)
      })
    })
    const results = await Promise.allSettled(updates)
    const succeeded = results.filter(fulfilled).length
    const failed = results.filter(rejected).length
    this.logger?.log(`MongoDBBoundWitnessStatsDiviner.UpdateChanges: Updated - Succeeded: ${succeeded} Failed: ${failed}`)
  }
}
