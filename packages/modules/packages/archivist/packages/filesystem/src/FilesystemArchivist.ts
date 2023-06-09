import { readFile } from 'node:fs/promises'

import { assertEx } from '@xylabs/assert'
import { AbstractArchivist } from '@xyo-network/abstract-archivist'
import { ArchivistAllQuerySchema, ArchivistCommitQuerySchema, ArchivistConfig, ArchivistModule, ArchivistParams } from '@xyo-network/archivist-model'
import { BoundWitness } from '@xyo-network/boundwitness-model'
import { MemoryArchivist } from '@xyo-network/memory-archivist'
import { AnyConfigSchema, creatableModule } from '@xyo-network/module'
import { Payload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { PromisableArray } from '@xyo-network/promise'

export interface FileSystemArchivistData {
  payloads: Payload[]
}

export type FilesystemArchivistConfigSchema = 'network.xyo.module.config.archivist.filesystem'
export const FilesystemArchivistConfigSchema: FilesystemArchivistConfigSchema = 'network.xyo.module.config.archivist.filesystem'

export type FilesystemArchivistConfig = ArchivistConfig<{
  filePath?: string
  schema: FilesystemArchivistConfigSchema
}>

export type FilesystemArchivistParams = ArchivistParams<AnyConfigSchema<FilesystemArchivistConfig>>

/** @description Currently only a read-only archivist that loads payloads from filesystem
 * but allows for future expansion to read/write
 */
@creatableModule()
export class FilesystemArchivist<TParams extends FilesystemArchivistParams = FilesystemArchivistParams>
  extends AbstractArchivist<TParams>
  implements ArchivistModule
{
  static override configSchema = FilesystemArchivistConfigSchema

  private _memoryArchivist?: MemoryArchivist

  get filePath() {
    return this.config?.filePath ?? 'archivist.xyo.json'
  }

  override get queries() {
    return [ArchivistAllQuerySchema, ArchivistCommitQuerySchema, ...super.queries]
  }

  private get memoryArchivist() {
    return assertEx(this._memoryArchivist)
  }

  private static dataFromRawJson(rawJson: string) {
    const data: FileSystemArchivistData = JSON.parse(rawJson)
    assertEx(typeof data === 'object', 'Archivist Data must be object')
    assertEx(Array.isArray(data.payloads), 'Archivist Data "payloads" field must be array of payloads')
    data.payloads = this.payloadsFromRawPayloads(data.payloads)
    return data
  }

  private static payloadsFromRawPayloads(rawPayloads: Payload[]) {
    //validation should be done in here.  I don't believe parse does much validation yet.
    return rawPayloads.map((payload) => PayloadWrapper.parse(payload).payload)
  }

  override all(): PromisableArray<Payload> {
    return this.memoryArchivist.all()
  }

  override clear(): void | Promise<void> {
    return this.memoryArchivist.clear()
  }

  override async commit(): Promise<BoundWitness[]> {
    return await this.memoryArchivist.commit()
  }

  override delete(hashes: string[]): PromisableArray<boolean> {
    return this.memoryArchivist.delete(hashes)
  }

  override async get(hashes: string[]): Promise<Payload[]> {
    return await this.memoryArchivist.get(hashes)
  }

  async insert(payloads: Payload[]): Promise<BoundWitness[]> {
    return await this.memoryArchivist.insert(payloads)
  }

  override async start() {
    await super.start()
    this._memoryArchivist = await MemoryArchivist.create()
    try {
      const data = FilesystemArchivist.dataFromRawJson(await this.rawJsonFromFile())
      await this._memoryArchivist.insert(data.payloads)
    } catch (ex) {
      const error = ex as Error
      this.logger?.error(error.message)
      throw ex
    }
  }

  private async rawJsonFromFile() {
    return await readFile(this.filePath, { encoding: 'utf8' })
  }
}
