import { assertEx } from '@xylabs/assert'
import { Account } from '@xyo-network/account'
import { AddressSchema } from '@xyo-network/address-payload-plugin'
import {
  AbstractModule,
  Module,
  ModuleDescription,
  ModuleFilter,
  ModuleParams,
  ModuleQueryResult,
  QueryBoundWitnessWrapper,
  SimpleModuleResolver,
  XyoErrorBuilder,
  XyoQueryBoundWitness,
} from '@xyo-network/module'
import { XyoPayload, XyoPayloadBuilder } from '@xyo-network/payload'
import { Promisable } from '@xyo-network/promise'

import { NodeConfig, NodeConfigSchema } from './Config'
import { NodeModule } from './NodeModule'
import { XyoNodeAttachedQuerySchema, XyoNodeAttachQuerySchema, XyoNodeDetachQuerySchema, XyoNodeQuery, XyoNodeRegisteredQuerySchema } from './Queries'

export abstract class AbstractNode<TConfig extends NodeConfig = NodeConfig, TModule extends AbstractModule = AbstractModule>
  extends AbstractModule<TConfig>
  implements NodeModule
{
  static configSchema = NodeConfigSchema
  public isModuleResolver = true

  protected internalResolver: SimpleModuleResolver<TModule>
  private _archivist?: Module

  protected constructor(params: ModuleParams<TConfig>, internalResolver?: SimpleModuleResolver<TModule>) {
    super(params)
    this.internalResolver = internalResolver ?? new SimpleModuleResolver<TModule>()
  }

  static override async create(params?: Partial<ModuleParams<NodeConfig>>): Promise<AbstractNode> {
    return (await super.create(params)) as AbstractNode
  }

  async attached(): Promise<string[]> {
    return (await this.attachedModules()).map((module) => module.address)
  }

  async attachedModules(): Promise<TModule[]> {
    return await (this.internalResolver.resolve() ?? [])
  }

  override async description(): Promise<ModuleDescription> {
    const desc = await super.description()
    const children = await Promise.all((await this.attachedModules()).map((mod) => mod.description()))
    return { ...desc, children }
  }

  public override queries() {
    return [XyoNodeAttachQuerySchema, XyoNodeDetachQuerySchema, XyoNodeAttachedQuerySchema, XyoNodeRegisteredQuerySchema, ...super.queries()]
  }

  override async query<T extends XyoQueryBoundWitness = XyoQueryBoundWitness>(query: T, payloads?: XyoPayload[]): Promise<ModuleQueryResult> {
    const wrapper = QueryBoundWitnessWrapper.parseQuery<XyoNodeQuery>(query, payloads)
    const typedQuery = wrapper.query.payload
    assertEx(this.queryable(typedQuery.schema, wrapper.addresses))

    const queryAccount = new Account()
    const resultPayloads: XyoPayload[] = []
    try {
      switch (typedQuery.schema) {
        case XyoNodeAttachQuerySchema: {
          this.attach(typedQuery.address)
          break
        }
        case XyoNodeDetachQuerySchema: {
          this.detach(typedQuery.address)
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
          const addresses = this.registered()
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

  register(_module: TModule): void {
    throw new Error('Method not implemented.')
  }

  registered(): string[] {
    throw new Error('Method not implemented.')
  }

  registeredModules(): TModule[] {
    throw new Error('Method not implemented.')
  }

  override async start() {
    await super.start()
    return this
  }

  unregister(_module: TModule): void {
    throw new Error('Method not implemented.')
  }

  abstract attach(address: string): void
  abstract detach(address: string): void
  abstract resolve(filter?: ModuleFilter): Promisable<TModule[]>
  abstract tryResolve(filter?: ModuleFilter): Promisable<TModule[]>
}

/** @deprecated use AbstractNode instead */
export abstract class XyoNode<TConfig extends NodeConfig = NodeConfig, TModule extends AbstractModule = AbstractModule> extends AbstractNode<
  TConfig,
  TModule
> {}
