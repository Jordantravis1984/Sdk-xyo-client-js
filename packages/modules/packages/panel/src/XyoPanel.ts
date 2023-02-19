import { assertEx } from '@xylabs/assert'
import { Account } from '@xyo-network/account'
import { AbstractArchivist, ArchivingModule, ArchivingModuleConfig } from '@xyo-network/archivist'
import { ArchivistWrapper } from '@xyo-network/archivist-wrapper'
import { XyoBoundWitness } from '@xyo-network/boundwitness-model'
import { ModuleConfig, ModuleParams, ModuleQueryResult, QueryBoundWitnessWrapper, XyoErrorBuilder, XyoQueryBoundWitness } from '@xyo-network/module'
import { XyoPayload } from '@xyo-network/payload-model'
import { AbstractWitness, WitnessWrapper } from '@xyo-network/witness'
import compact from 'lodash/compact'
import uniq from 'lodash/uniq'

import { PanelModule } from './Panel'
import { XyoPanelQuery, XyoPanelReportQuerySchema } from './Queries'

export type XyoPanelConfigSchema = 'network.xyo.panel.config'
export const XyoPanelConfigSchema: XyoPanelConfigSchema = 'network.xyo.panel.config'

export type XyoPanelConfig = ArchivingModuleConfig<{
  onReportEnd?: (boundWitness?: XyoBoundWitness, errors?: Error[]) => void
  onReportStart?: () => void
  onWitnessReportEnd?: (witness: WitnessWrapper, error?: Error) => void
  onWitnessReportStart?: (witness: WitnessWrapper) => void
  schema: XyoPanelConfigSchema
  witnesses?: string[]
}>

export class XyoPanel extends ArchivingModule<XyoPanelConfig> implements PanelModule {
  static override configSchema: XyoPanelConfigSchema

  public history: XyoBoundWitness[] = []
  private _archivists: ArchivistWrapper[] | undefined
  private _witnesses: WitnessWrapper[] | undefined

  public override get queries(): string[] {
    return [XyoPanelReportQuerySchema, ...super.queries]
  }

  static override async create(params?: Partial<ModuleParams<XyoPanelConfig>>): Promise<XyoPanel> {
    return (await super.create(params)) as XyoPanel
  }

  public addWitness(address: string[]) {
    this.config.witnesses = uniq([...address, ...(this.config.witnesses ?? [])])
    this._witnesses = undefined
  }

  public async getArchivists() {
    const addresses = this.config?.archivists ? (Array.isArray(this.config.archivists) ? this.config?.archivists : [this.config.archivists]) : []
    this._archivists =
      this._archivists ||
      ((await this.resolver?.resolve({ address: addresses })) as AbstractArchivist[]).map((witness) => new ArchivistWrapper(witness))

    return this._archivists
  }

  public async getWitnesses() {
    const addresses = this.config?.witnesses ? (Array.isArray(this.config.witnesses) ? this.config?.witnesses : [this.config.witnesses]) : []
    this._witnesses =
      this._witnesses || ((await this.resolver?.resolve({ address: addresses })) as AbstractWitness[]).map((witness) => new WitnessWrapper(witness))

    return this._witnesses
  }

  override async query<T extends XyoQueryBoundWitness = XyoQueryBoundWitness, TConfig extends ModuleConfig = ModuleConfig>(
    query: T,
    payloads?: XyoPayload[],
    queryConfig?: TConfig,
  ): Promise<ModuleQueryResult> {
    const wrapper = QueryBoundWitnessWrapper.parseQuery<XyoPanelQuery>(query, payloads)
    const typedQuery = wrapper.query
    assertEx(this.queryable(query, payloads, queryConfig))
    const queryAccount = new Account()
    const resultPayloads: XyoPayload[] = []
    try {
      switch (typedQuery.schemaName) {
        case XyoPanelReportQuerySchema: {
          const reportResult = await this.report(payloads)
          resultPayloads.push(...(reportResult[0], reportResult[1]))
          break
        }
        default:
          return super.query(query, payloads)
      }
    } catch (ex) {
      const error = ex as Error
      resultPayloads.push(new XyoErrorBuilder([wrapper.hash], error.message).build())
    }
    return await this.bindResult(resultPayloads, queryAccount)
  }

  public removeArchivist(address: string[]) {
    this.config.archivists = (this.config.archivists ?? []).filter((archivist) => !address.includes(archivist))
    this._archivists = undefined
  }

  public removeWitness(address: string[]) {
    this.config.witnesses = (this.config.witnesses ?? []).filter((witness) => !address.includes(witness))
    this._witnesses = undefined
  }

  public async report(payloads: XyoPayload[] = []): Promise<[XyoBoundWitness, XyoPayload[]]> {
    const errors: Error[] = []
    this.config?.onReportStart?.()
    const allWitnesses = [...(await this.getWitnesses())]
    const allPayloads: XyoPayload[] = []

    try {
      const generatedPayloads = compact(await this.generatePayloads(allWitnesses))
      const combinedPayloads = [...generatedPayloads, ...payloads]
      allPayloads.push(...combinedPayloads)
    } catch (e) {
      errors.push(e as Error)
    }

    const [newBoundWitness] = await this.bindResult(allPayloads)
    this.history.push(assertEx(newBoundWitness))
    this.config?.onReportEnd?.(newBoundWitness, errors.length > 0 ? errors : undefined)
    return [newBoundWitness, allPayloads]
  }

  public async tryReport(payloads: XyoPayload[] = []): Promise<[XyoBoundWitness | null, XyoPayload[]]> {
    try {
      return await this.report(payloads)
    } catch (ex) {
      const error = ex as Error
      this.logger?.warn(`report failed [${error.message}]`)
      return [null, []]
    }
  }

  private async generatePayloads(witnesses: WitnessWrapper[]): Promise<XyoPayload[]> {
    return (await Promise.all(witnesses?.map(async (witness) => await witness.observe()))).flat()
  }
}
