import { assertEx } from '@xylabs/assert'
import { Account } from '@xyo-network/account'
import { AddressPayload, AddressSchema } from '@xyo-network/address-payload-plugin'
import {
  AbstractModule,
  AbstractModuleConfig,
  CompositeModuleResolver,
  Module,
  ModuleConstructable,
  ModuleDescription,
  ModuleFilter,
  ModuleParams,
  ModuleQueryResult,
  ModuleWrapper,
  QueryBoundWitnessWrapper,
  XyoErrorBuilder,
  XyoQueryBoundWitness,
} from '@xyo-network/module'
import { XyoPayloadBuilder } from '@xyo-network/payload-builder'
import { XyoPayload } from '@xyo-network/payload-model'
import { Promisable } from '@xyo-network/promise'

import { NodeConfig, NodeConfigSchema } from './Config'
import { NodeModule } from './Node'
import { XyoNodeAttachedQuerySchema, XyoNodeAttachQuerySchema, XyoNodeDetachQuerySchema, XyoNodeQuery, XyoNodeRegisteredQuerySchema } from './Queries'

//const childModuleDiscoverQueryPayload = PayloadWrapper.parse<AbstractModuleDiscoverQuery>({ schema: AbstractModuleDiscoverQuerySchema })

export interface AbstractNodeParams<TConfig extends NodeConfig = NodeConfig> extends ModuleParams<TConfig> {
  internalResolver?: CompositeModuleResolver
}

export abstract class AbstractNode<TConfig extends NodeConfig = NodeConfig> extends AbstractModule<TConfig> implements NodeModule<AbstractModule> {
  static readonly configSchema = NodeConfigSchema

  protected internalResolver = new CompositeModuleResolver()

  private readonly isNode = true

  protected constructor(params: AbstractNodeParams<TConfig>) {
    super(params)
  }

  get isModuleResolver(): boolean {
    return true
  }

  static override async create(params?: Partial<AbstractNodeParams>): Promise<AbstractNode> {
    return (await super.create(params)) as AbstractNode
  }

  static isNode(module: unknown) {
    return (module as AbstractNode).isNode
  }

  async attached(): Promise<string[]> {
    return (await this.attachedModules()).map((module) => module.address)
  }

  async attachedModules(): Promise<Module[]> {
    return await (this.internalResolver.resolve() ?? [])
  }

  override async description(): Promise<ModuleDescription> {
    const desc = await super.description()
    const children = await Promise.all((await this.attachedModules()).map((mod) => mod.description()))
    return { ...desc, children }
  }
  override async discover(_queryAccount?: Account | undefined): Promise<XyoPayload[]> {
    const parent = await super.discover(_queryAccount)
    const childMods = (await this.attachedModules()).map((mod) => new ModuleWrapper(mod))
    const childModAddresses = childMods.map((mod) =>
      new XyoPayloadBuilder<AddressPayload>({ schema: AddressSchema }).fields({ address: mod.address }).build(),
    )

    return [...parent, ...childModAddresses]
  }

  public override queries() {
    return [XyoNodeAttachQuerySchema, XyoNodeDetachQuerySchema, XyoNodeAttachedQuerySchema, XyoNodeRegisteredQuerySchema, ...super.queries()]
  }

  override async query<T extends XyoQueryBoundWitness = XyoQueryBoundWitness, TConfig extends AbstractModuleConfig = AbstractModuleConfig>(
    query: T,
    payloads?: XyoPayload[],
    queryConfig?: TConfig,
  ): Promise<ModuleQueryResult> {
    const wrapper = QueryBoundWitnessWrapper.parseQuery<XyoNodeQuery>(query, payloads)
    const typedQuery = wrapper.query.payload
    assertEx(this.queryable(query, payloads, queryConfig))
    const queryAccount = new Account()
    const resultPayloads: XyoPayload[] = []
    try {
      switch (typedQuery.schema) {
        case XyoNodeAttachQuerySchema: {
          await this.attach(typedQuery.address)
          break
        }
        case XyoNodeDetachQuerySchema: {
          await this.detach(typedQuery.address)
          break
        }
        case XyoNodeAttachedQuerySchema: {
          const addresses = await this.attached()
          for (const address of addresses) {
            const payload = new XyoPayloadBuilder({ schema: AddressSchema }).fields({ address }).build()
            resultPayloads.push(payload)
          }
          break
        }
        case XyoNodeRegisteredQuerySchema: {
          const addresses = await this.registered()
          for (const address of addresses) {
            const payload = new XyoPayloadBuilder({ schema: AddressSchema }).fields({ address }).build()
            resultPayloads.push(payload)
          }
          break
        }
        default:
          return await super.query(query, payloads)
      }
    } catch (ex) {
      const error = ex as Error
      resultPayloads.push(new XyoErrorBuilder([wrapper.hash], error.message).build())
    }
    return this.bindResult(resultPayloads, queryAccount)
  }

  register(_module: AbstractModule, _attach = false): Promisable<void> {
    throw new Error('Method not implemented.')
  }

  registered(): Promisable<string[]> {
    throw new Error('Method not implemented.')
  }

  registeredModules(): Promisable<Module[]> {
    throw new Error('Method not implemented.')
  }

  /**
   * Resolves the supplied filter into wrapped modules
   * @example <caption>Example using ArchivistWrapper</caption>
   * const filter = { address: [address] }
   * const mods: ArchivistWrapper[] = await node.resolveWrapped(ArchivistWrapper, filter)
   * @param wrapper The ModuleWrapper class (ArchivistWrapper,
   * DivinerWrapper, etc.)
   * @param filter The ModuleFilter
   * @returns An array of ModuleWrapper instances corresponding to
   * the underlying modules matching the supplied filter
   */
  async resolveWrapped<T extends ModuleWrapper<Module> = ModuleWrapper<Module>>(
    wrapper: ModuleConstructable<Module, T>,
    filter?: ModuleFilter,
  ): Promise<T[]> {
    return (await this.resolve(filter)).map((mod) => new wrapper(mod))
  }

  override async start() {
    await super.start()
    return this
  }

  unregister(_module: Module): Promisable<void> {
    throw new Error('Method not implemented.')
  }

  abstract attach(address: string, name?: string, external?: boolean): Promisable<void>
  abstract detach(address: string): Promisable<void>
}

/** @deprecated use AbstractNode instead */
export abstract class XyoNode<TConfig extends NodeConfig = NodeConfig> extends AbstractNode<TConfig> {}
