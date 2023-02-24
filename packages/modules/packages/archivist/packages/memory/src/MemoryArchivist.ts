import { assertEx } from '@xylabs/assert'
import { fulfilled } from '@xylabs/promise'
import { AbstractArchivist } from '@xyo-network/abstract-archivist'
import {
  ArchivistAllQuerySchema,
  ArchivistClearQuerySchema,
  ArchivistCommitQuerySchema,
  ArchivistConfig,
  ArchivistDeleteQuerySchema,
  ArchivistFindQuerySchema,
  ArchivistInsertQuery,
  ArchivistInsertQuerySchema,
} from '@xyo-network/archivist-model'
import { XyoBoundWitness } from '@xyo-network/boundwitness-model'
import { ModuleParams } from '@xyo-network/module'
import { XyoPayload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { PromisableArray } from '@xyo-network/promise'
import compact from 'lodash/compact'
import LruCache from 'lru-cache'

export type MemoryArchivistConfigSchema = 'network.xyo.module.config.archivist.memory'
export const MemoryArchivistConfigSchema: MemoryArchivistConfigSchema = 'network.xyo.module.config.archivist.memory'

export type MemoryArchivistConfig = ArchivistConfig<{
  max?: number
  schema: MemoryArchivistConfigSchema
}>

export class MemoryArchivist<TConfig extends MemoryArchivistConfig = MemoryArchivistConfig> extends AbstractArchivist<TConfig> {
  static override configSchema = MemoryArchivistConfigSchema

  private cache: LruCache<string, XyoPayload | null>

  protected constructor(params: ModuleParams<TConfig>) {
    super(params)
    this.cache = new LruCache<string, XyoPayload | null>({ max: this.max })
  }

  get max() {
    return this.config?.max ?? 10000
  }

  override get queries() {
    return [
      ArchivistAllQuerySchema,
      ArchivistDeleteQuerySchema,
      ArchivistClearQuerySchema,
      ArchivistFindQuerySchema,
      ArchivistInsertQuerySchema,
      ArchivistCommitQuerySchema,
      ...super.queries,
    ]
  }

  static override async create(params?: ModuleParams<MemoryArchivistConfig>): Promise<MemoryArchivist> {
    return (await super.create(params)) as MemoryArchivist
  }

  override all(): PromisableArray<XyoPayload> {
    return compact(this.cache.dump().map((value) => value[1].value))
  }

  override clear(): void | Promise<void> {
    this.cache.clear()
  }

  override async commit(): Promise<XyoBoundWitness[]> {
    const payloads = assertEx(await this.all(), 'Nothing to commit')
    const settled = await Promise.allSettled(
      compact(
        Object.values((await this.parents()).commit ?? [])?.map(async (parent) => {
          const queryPayload = PayloadWrapper.parse<ArchivistInsertQuery>({
            payloads: payloads.map((payload) => PayloadWrapper.hash(payload)),
            schema: ArchivistInsertQuerySchema,
          })
          const query = await this.bindQuery(queryPayload, payloads)
          return (await parent?.query(query[0], query[1]))?.[0]
        }),
      ),
    )
    await this.clear()
    return compact(settled.filter(fulfilled).map((result) => result.value))
  }

  override delete(hashes: string[]): PromisableArray<boolean> {
    return hashes.map((hash) => {
      return this.cache.delete(hash)
    })
  }

  override async get(hashes: string[]): Promise<XyoPayload[]> {
    return compact(
      await Promise.all(
        hashes.map(async (hash) => {
          const payload = this.cache.get(hash) ?? (await super.get([hash]))[0] ?? null
          if (this.storeParentReads) {
            this.cache.set(hash, payload)
          }
          return payload
        }),
      ),
    )
  }

  async insert(payloads: XyoPayload[]): Promise<XyoBoundWitness[]> {
    payloads.map((payload) => {
      const wrapper = new PayloadWrapper(payload)
      const payloadWithMeta = { ...payload, _hash: wrapper.hash, _timestamp: Date.now() }
      this.cache.set(payloadWithMeta._hash, payloadWithMeta)
      return payloadWithMeta
    })

    const result = await this.bindResult([...payloads])
    const parentBoundWitnesses: XyoBoundWitness[] = []
    const parents = await this.parents()
    if (Object.entries(parents.write ?? {}).length) {
      //we store the child bw also
      parentBoundWitnesses.push(...(await this.writeToParents([result[0], ...payloads])))
    }
    return [result[0], ...parentBoundWitnesses]
  }
}
