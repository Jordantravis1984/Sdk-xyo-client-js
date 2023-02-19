import { AbstractDiviner } from '@xyo-network/diviner'
import { ModuleParams } from '@xyo-network/module'

import { XyoArchivistApi } from '../../Api'
import { XyoArchiveListApiDivinerConfig, XyoArchiveListApiDivinerConfigSchema, XyoArchiveSchema } from './ArchiveListApiDivinerConfig'
import { ArchiveList } from './Payload'

export type XyoArchiveListApiDivinerParams = ModuleParams<XyoArchiveListApiDivinerConfig> & { api: XyoArchivistApi }

export class ArchiveListApiDiviner extends AbstractDiviner<XyoArchiveListApiDivinerConfig> {
  static override configSchema = XyoArchiveListApiDivinerConfigSchema
  static override targetSchema = XyoArchiveSchema

  protected readonly api: XyoArchivistApi

  protected constructor(params: XyoArchiveListApiDivinerParams) {
    super(params)
    this.api = params.api
  }

  static override async create(params: XyoArchiveListApiDivinerParams): Promise<ArchiveListApiDiviner> {
    return (await super.create(params)) as ArchiveListApiDiviner
  }

  public async divine(): Promise<ArchiveList[]> {
    const apiResult = (await this.api.archives.get()) ?? []
    return (
      apiResult.map((archive) => {
        return {
          archive,
          schema: XyoArchiveSchema,
        }
      }) ?? []
    )
  }

  protected override async start() {
    await super.start()
    return this
  }
}
