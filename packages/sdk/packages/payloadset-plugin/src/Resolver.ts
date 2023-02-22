import { Hasher, Validator } from '@xyo-network/core'
import { QueryBoundWitnessWrapper, XyoQueryBoundWitness } from '@xyo-network/module'
import { PayloadSetPayload } from '@xyo-network/payload-model'
import { WitnessModule } from '@xyo-network/witness'

import { PayloadSetPluginParams } from './Configs'
import { isPayloadSetDivinerPlugin, isPayloadSetWitnessPlugin, PayloadSetDivinerPlugin, PayloadSetPlugin, PayloadSetWitnessPlugin } from './Plugin'

export class PayloadSetPluginResolver {
  protected _plugins: Record<string, PayloadSetPlugin> = {}
  protected params: Record<string, PayloadSetPluginParams> = {}

  constructor(
    /** @param plugins The initial set of plugins */
    plugins?: PayloadSetPlugin[],
  ) {
    plugins?.forEach((plugin) => this.register(plugin))
  }

  public async diviner(set: string) {
    return await isPayloadSetDivinerPlugin(this._plugins[set])?.diviner?.(this.params[set]?.diviner)
  }

  public diviners() {
    const result: PayloadSetDivinerPlugin[] = []
    Object.values(this._plugins).forEach((plugin) => {
      const diviner = isPayloadSetDivinerPlugin(plugin)
      if (diviner) {
        result.push(diviner)
      }
    })
    return result
  }

  public plugins() {
    const result: PayloadSetPlugin[] = []
    Object.values(this._plugins).forEach((value) => {
      result.push(value)
    })
    return result
  }

  public register<TPlugin extends PayloadSetPlugin = PayloadSetPlugin, TParams extends TPlugin['params'] = TPlugin['params']>(
    plugin: TPlugin,
    params?: TParams,
  ) {
    const setHash = Hasher.hash(plugin.set)
    this._plugins[setHash] = plugin
    this.params[setHash] = params ?? {}
    return this
  }

  public resolve(set?: PayloadSetPayload): PayloadSetPlugin | undefined
  public resolve(set?: string): PayloadSetPlugin | undefined
  public resolve(set?: string | PayloadSetPayload): PayloadSetPlugin | undefined {
    const setHash = typeof set === 'string' ? set : set ? Hasher.hash(set) : undefined
    return setHash ? this._plugins[setHash] ?? undefined : undefined
  }

  public sets() {
    const result: PayloadSetPayload[] = []
    Object.values(this._plugins).forEach((value) => {
      result.push(value.set)
    })
    return result
  }

  public validate(boundwitness: XyoQueryBoundWitness): Validator<XyoQueryBoundWitness> | undefined {
    return this.resolve(boundwitness.resultSet)?.validate?.(boundwitness)
  }

  public async witness(set: PayloadSetPayload): Promise<WitnessModule | undefined>
  public async witness(set: string): Promise<WitnessModule | undefined>
  public async witness(set: string | PayloadSetPayload): Promise<WitnessModule | undefined> {
    const setHash = typeof set === 'string' ? set : Hasher.hash(set)
    return await isPayloadSetWitnessPlugin(this._plugins[setHash])?.witness?.(this.params[setHash]?.diviner)
  }

  public witnesses() {
    const result: PayloadSetWitnessPlugin[] = []
    Object.values(this._plugins).forEach((plugin) => {
      const witness = isPayloadSetWitnessPlugin(plugin)
      if (witness) {
        result.push(witness)
      }
    })
    return result
  }

  public wrap(boundwitness: XyoQueryBoundWitness): QueryBoundWitnessWrapper | undefined {
    return this.resolve(boundwitness.resultSet)?.wrap?.(boundwitness)
  }
}
