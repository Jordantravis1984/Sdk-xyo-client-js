import { assertEx } from '@xylabs/assert'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { BaseMongoSdk, BaseMongoSdkConfig } from '@xyo-network/sdk-xyo-mongo-js'
import { Collection, ExplainVerbosity, Filter, SortDirection } from 'mongodb'

import { PayloadWithPartialMeta } from './Meta'

export class XyoArchivistPayloadMongoSdk extends BaseMongoSdk<PayloadWithPartialMeta> {
  private _archive: string
  private _maxTime: number
  constructor(config: BaseMongoSdkConfig, archive: string, maxTime = 2000) {
    super(config)
    this._archive = archive
    this._maxTime = maxTime
  }

  async deleteByHash(hash: string) {
    return await this.useCollection(async (collection: Collection<PayloadWithPartialMeta>) => {
      return await collection.deleteMany({ _archive: this._archive, _hash: hash })
    })
  }

  async fetchCount() {
    return await this.useCollection(async (collection: Collection<PayloadWithPartialMeta>) => {
      return await collection.estimatedDocumentCount()
    })
  }

  async findAfter(timestamp: number, limit = 20) {
    return (await this.findAfterQuery(timestamp, limit)).toArray()
  }

  async findAfterPlan(timestamp: number, limit = 20) {
    return (await this.findAfterQuery(timestamp, limit)).explain(ExplainVerbosity.allPlansExecution)
  }

  async findBefore(timestamp: number, limit = 20) {
    return (await this.findBeforeQuery(timestamp, limit)).toArray()
  }

  async findBeforePlan(timestamp: number, limit = 20) {
    return (await this.findBeforeQuery(timestamp, limit)).explain(ExplainVerbosity.allPlansExecution)
  }

  async findByHash(hash: string, timestamp?: number) {
    return (await this.findByHashQuery(hash, timestamp)).toArray()
  }

  async findByHashPlan(hash: string, timestamp?: number) {
    return (await this.findByHashQuery(hash, timestamp)).explain(ExplainVerbosity.allPlansExecution)
  }

  async findByHashes(hashes: string[]) {
    return await this.useCollection(async (collection: Collection<PayloadWithPartialMeta>) => {
      const promises = hashes.map((hash) => {
        return collection.find({ _archive: this._archive, _hash: hash }).maxTimeMS(this._maxTime).toArray()
      })
      const results = await Promise.allSettled(promises)
      const finalResult: PayloadWithPartialMeta[] = []
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          finalResult.push(...result.value)
        }
      })
      return finalResult
    })
  }

  async findRecent(limit = 20) {
    return (await this.findRecentQuery(limit)).toArray()
  }

  async findRecentPlan(limit = 20) {
    return (await this.findRecentQuery(limit)).explain(ExplainVerbosity.allPlansExecution)
  }

  async findRecentQuery(limit: number) {
    assertEx(limit <= 100, `limit must be <= 100 [${limit}]`)
    return await this.useCollection((collection: Collection<PayloadWithPartialMeta>) => {
      return collection.find({ _archive: this._archive }).sort({ _timestamp: -1 }).limit(limit).maxTimeMS(this._maxTime)
    })
  }

  async findSorted(timestamp: number, limit: number, order: 'asc' | 'desc', schema?: string) {
    return (await this.findSortedQuery(timestamp, limit, order, schema)).toArray()
  }

  async insert(item: PayloadWithPartialMeta) {
    const _timestamp = Date.now()
    const wrapper = new PayloadWrapper(item)
    return await super.insertOne({
      ...item,
      _archive: this._archive,
      _hash: wrapper.hash,
      _timestamp,
    })
  }

  override async insertMany(items: PayloadWithPartialMeta[]) {
    const _timestamp = Date.now()
    const itemsToInsert = items.map((item) => {
      const wrapper = new PayloadWrapper(item)
      return {
        ...item,
        _archive: this._archive,
        _hash: wrapper.hash,
        _timestamp,
      }
    })
    return await super.insertMany(itemsToInsert)
  }

  async updateByHash(hash: string, payload: PayloadWithPartialMeta) {
    return await this.useCollection(async (collection: Collection<PayloadWithPartialMeta>) => {
      return await collection.updateMany({ _archive: this._archive, _hash: hash }, payload)
    })
  }

  private async findAfterQuery(timestamp: number, limit: number) {
    assertEx(limit <= 100, `limit must be <= 100 [${limit}]`)
    return await this.useCollection((collection: Collection<PayloadWithPartialMeta>) => {
      return collection
        .find({ _archive: this._archive, _timestamp: { $gt: timestamp } })
        .sort({ _timestamp: 1 })
        .limit(limit)
        .maxTimeMS(this._maxTime)
    })
  }

  private async findBeforeQuery(timestamp: number, limit: number) {
    assertEx(limit <= 100, `limit must be <= 100 [${limit}]`)
    return await this.useCollection((collection: Collection<PayloadWithPartialMeta>) => {
      return collection
        .find({ _archive: this._archive, _timestamp: { $lt: timestamp } })
        .sort({ _timestamp: -1 })
        .limit(limit)
        .maxTimeMS(this._maxTime)
    })
  }

  private async findByHashQuery(hash: string, timestamp?: number) {
    const predicate = timestamp ? { _archive: this._archive, _hash: hash, _timestamp: timestamp } : { _archive: this._archive, _hash: hash }
    return await this.useCollection(async (collection: Collection<PayloadWithPartialMeta>) => {
      return await collection.find(predicate).maxTimeMS(this._maxTime)
    })
  }

  private async findSortedQuery(timestamp: number, limit: number, order: 'asc' | 'desc', schema?: string) {
    assertEx(limit <= 100, `limit must be <= 100 [${limit}]`)
    const _queryTimestamp = order === 'desc' ? { $lt: timestamp } : { $gt: timestamp }
    const query: Filter<PayloadWithPartialMeta> = { _archive: this._archive, _timestamp: _queryTimestamp }
    if (schema) {
      query.schema = schema
    }
    const sort: { [key: string]: SortDirection } = { _timestamp: order === 'asc' ? 1 : -1 }
    return await this.useCollection((collection: Collection<PayloadWithPartialMeta>) => {
      return collection.find(query).sort(sort).limit(limit).maxTimeMS(this._maxTime)
    })
  }
}
