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
} from '@xyo-network/archivist-interface'
import { XyoBoundWitness } from '@xyo-network/boundwitness-model'
import { ModuleParams } from '@xyo-network/module'
import { XyoPayload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { PromisableArray } from '@xyo-network/promise'
import Cookies from 'js-cookie'
import compact from 'lodash/compact'

export type CookieArchivistConfigSchema = 'network.xyo.module.config.archivist.cookie'
export const CookieArchivistConfigSchema: CookieArchivistConfigSchema = 'network.xyo.module.config.archivist.cookie'

export type CookieArchivistConfig = ArchivistConfig<{
  domain?: string
  maxEntries?: number
  maxEntrySize?: number
  namespace?: string
  schema: CookieArchivistConfigSchema
}>

export class CookieArchivist extends AbstractArchivist<CookieArchivistConfig> {
  static override configSchema = CookieArchivistConfigSchema

  get domain() {
    return this.config?.domain
  }

  get maxEntries() {
    //all browsers support at least 60 cookies
    return this.config?.maxEntries ?? 60
  }

  get maxEntrySize() {
    //all browsers support at least 4000 length per cookie
    return this.config?.maxEntrySize ?? 4000
  }

  get namespace() {
    return this.config?.namespace ?? 'xyoarch'
  }

  override get queries(): string[] {
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

  static override async create(params?: ModuleParams<CookieArchivistConfig>): Promise<CookieArchivist> {
    return (await super.create(params)) as CookieArchivist
  }

  override all(): PromisableArray<XyoPayload> {
    try {
      return Object.entries(Cookies.get())
        .filter(([key]) => key.startsWith(`${this.namespace}-`))
        .map(([, value]) => JSON.parse(value))
    } catch (ex) {
      console.error(`Error: ${JSON.stringify(ex, null, 2)}`)
      throw ex
    }
  }

  override clear(): void | Promise<void> {
    try {
      Object.entries(Cookies.get()).map(([key]) => {
        if (key.startsWith(`${this.namespace}-`)) {
          Cookies.remove(key)
        }
      })
    } catch (ex) {
      console.error(`Error: ${JSON.stringify(ex, null, 2)}`)
      throw ex
    }
  }

  override async commit(): Promise<XyoBoundWitness[]> {
    try {
      const payloads = await this.all()
      assertEx(payloads.length > 0, 'Nothing to commit')
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
    } catch (ex) {
      console.error(`Error: ${JSON.stringify(ex, null, 2)}`)
      throw ex
    }
  }

  override delete(hashes: string[]): PromisableArray<boolean> {
    try {
      return hashes.map((hash) => {
        Cookies.remove(this.keyFromHash(hash))
        return true
      })
    } catch (ex) {
      console.error(`Error: ${JSON.stringify(ex, null, 2)}`)
      throw ex
    }
  }

  override async get(hashes: string[]): Promise<XyoPayload[]> {
    try {
      return await Promise.all(
        hashes.map(async (hash) => {
          const cookieString = Cookies.get(this.keyFromHash(hash))
          return cookieString ? JSON.parse(cookieString) : (await this.getFromParents(hash)) ?? null
        }),
      )
    } catch (ex) {
      console.error(`Error: ${JSON.stringify(ex, null, 2)}`)
      throw ex
    }
  }

  async insert(payloads: XyoPayload[]): Promise<XyoBoundWitness[]> {
    try {
      const storedPayloads: XyoPayload[] = payloads.map((payload) => {
        const wrapper = new PayloadWrapper(payload)
        const key = this.keyFromHash(wrapper.hash)
        const value = JSON.stringify(wrapper.payload)
        assertEx(value.length < this.maxEntrySize, `Payload too large [${wrapper.hash}, ${value.length}]`)
        Cookies.set(key, JSON.stringify(wrapper.payload))
        return wrapper.payload
      })
      const result = await this.bindResult([...storedPayloads])
      const parentBoundWitnesses: XyoBoundWitness[] = []
      const parents = await this.parents()
      if (Object.entries(parents.write ?? {}).length) {
        //we store the child bw also
        parentBoundWitnesses.push(...(await this.writeToParents([result[0], ...storedPayloads])))
      }
      return [result[0], ...parentBoundWitnesses]
    } catch (ex) {
      console.error(`Error: ${JSON.stringify(ex, null, 2)}`)
      throw ex
    }
  }

  private keyFromHash(hash: string) {
    return `${this.namespace}-${hash}`
  }
}
