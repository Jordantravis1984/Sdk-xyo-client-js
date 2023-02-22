import { assertEx } from '@xylabs/assert'
import { fulfilled } from '@xylabs/promise'
import { AbstractArchivist } from '@xyo-network/abstract-archivist'
import { Account } from '@xyo-network/account'
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
import compact from 'lodash/compact'
import store, { StoreBase } from 'store2'

export type StorageArchivistConfigSchema = 'network.xyo.module.config.archivist.storage'
export const StorageArchivistConfigSchema: StorageArchivistConfigSchema = 'network.xyo.module.config.archivist.storage'

export type StorageArchivistConfig = ArchivistConfig<{
  maxEntries?: number
  maxEntrySize?: number
  namespace?: string
  persistAccount?: boolean
  schema: StorageArchivistConfigSchema
  type?: 'local' | 'session' | 'page'
}>

export class XyoStorageArchivist extends AbstractArchivist<StorageArchivistConfig> {
  static override configSchema = StorageArchivistConfigSchema

  private _privateStorage: StoreBase | undefined
  private _storage: StoreBase | undefined

  constructor(params: ModuleParams<StorageArchivistConfig>) {
    super(params)
  }

  public get maxEntries() {
    return this.config?.maxEntries ?? 1000
  }

  public get maxEntrySize() {
    return this.config?.maxEntries ?? 16000
  }

  public get namespace() {
    return this.config?.namespace ?? 'xyo-archivist'
  }

  public get persistAccount() {
    return this.config?.persistAccount ?? false
  }

  public override get queries(): string[] {
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

  public get type() {
    return this.config?.type ?? 'local'
  }

  /* This has to be a getter so that it can access it during construction */
  private get privateStorage(): StoreBase {
    this._privateStorage = this._storage ?? store[this.type].namespace(`${this.namespace}|private`)
    return this._privateStorage
  }

  /* This has to be a getter so that it can access it during construction */
  private get storage(): StoreBase {
    this._storage = this._storage ?? store[this.type].namespace(this.namespace)
    return this._storage
  }

  static override async create(params?: ModuleParams<StorageArchivistConfig>): Promise<XyoStorageArchivist> {
    return (await super.create(params)) as XyoStorageArchivist
  }

  public override all(): PromisableArray<XyoPayload> {
    this.logger?.log(`this.storage.length: ${this.storage.length}`)
    return Object.entries(this.storage.getAll()).map(([, value]) => value)
  }

  public override clear(): void | Promise<void> {
    this.logger?.log(`this.storage.length: ${this.storage.length}`)
    this.storage.clear()
  }

  public override async commit(): Promise<XyoBoundWitness[]> {
    this.logger?.log(`this.storage.length: ${this.storage.length}`)
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
    // TODO - rather than clear, delete the payloads that come back as successfully inserted
    await this.clear()
    return compact(settled.filter(fulfilled).map((result) => result.value))
  }

  public override delete(hashes: string[]): PromisableArray<boolean> {
    this.logger?.log(`hashes.length: ${hashes.length}`)
    return hashes.map((hash) => {
      this.storage.remove(hash)
      return true
    })
  }

  public async get(hashes: string[]): Promise<XyoPayload[]> {
    this.logger?.log(`hashes.length: ${hashes.length}`)

    return await Promise.all(
      hashes.map(async (hash) => {
        const payload = this.storage.get(hash) ?? (await super.get([hash]))[0] ?? null
        if (this.storeParentReads) {
          this.storage.set(hash, payload)
        }
        return payload
      }),
    )
  }

  public async insert(payloads: XyoPayload[]): Promise<XyoBoundWitness[]> {
    this.logger?.log(`payloads.length: ${payloads.length}`)

    const storedPayloads = payloads.map((payload) => {
      const wrapper = new PayloadWrapper(payload)
      const hash = wrapper.hash
      const value = JSON.stringify(wrapper.payload)
      assertEx(value.length < this.maxEntrySize, `Payload too large [${wrapper.hash}, ${value.length}]`)
      this.storage.set(hash, wrapper.payload)
      return wrapper.payload
    })
    const [storageBoundWitness] = await this.bindResult([...storedPayloads])
    const parentBoundWitnesses: XyoBoundWitness[] = []
    const parents = await this.parents()
    if (Object.entries(parents.write ?? {}).length) {
      //we store the child bw also
      const [parentBoundWitness] = await this.writeToParents([storageBoundWitness, ...storedPayloads])
      parentBoundWitnesses.push(parentBoundWitness)
    }
    return [storageBoundWitness, ...parentBoundWitnesses]
  }

  override async start() {
    await super.start()
    this.saveAccount()
    return this
  }

  protected override loadAccount(account?: Account) {
    if (this.persistAccount) {
      const privateKey = this.privateStorage.get('privateKey')
      if (privateKey) {
        try {
          const account = new Account({ privateKey })
          this.logger?.log(account.addressValue.hex)
          return account
        } catch (ex) {
          console.error(`Error reading Account from storage [${this.type}, ${ex}] - Recreating Account`)
          this.privateStorage.remove('privateKey')
        }
      }
    }
    return super.loadAccount(account)
  }

  protected saveAccount() {
    if (this.persistAccount) {
      this.logger?.log(this.account.addressValue.hex)
      this.privateStorage.set('privateKey', this.account.private.hex)
    }
  }
}
