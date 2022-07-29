import { Buffer } from '@xylabs/buffer'
import { assertEx } from '@xylabs/sdk-js'
import { XyoAccount } from '@xyo-network/account'
import { sortFields, XyoHasher } from '@xyo-network/core'
import { XyoPayload } from '@xyo-network/payload'

import { XyoBoundWitness, XyoBoundWitnessWithMeta } from '../models'

export interface XyoBoundWitnessBuilderConfig {
  /** Whether or not the payloads should be included in the metadata sent to and recorded by the ArchivistApi */
  readonly inlinePayloads?: boolean
}

export class XyoBoundWitnessBuilder<TBoundWitness extends XyoBoundWitness = XyoBoundWitness, TPayload extends XyoPayload = XyoPayload> {
  private _accounts: XyoAccount[] = []
  private _payload_schemas: string[] = []
  private _payloads: TPayload[] = []

  constructor(public readonly config: XyoBoundWitnessBuilderConfig = { inlinePayloads: false }) {}

  private get _payload_hashes(): string[] {
    return this._payloads.map((payload) => {
      return new XyoHasher(payload).hash
    })
  }

  public witness(account: XyoAccount) {
    this._accounts?.push(account)
    return this
  }

  public payloads(payloads: (TPayload | null)[]) {
    payloads.forEach((payload) => {
      if (payload !== null) {
        this.payload(payload)
      }
    })
    return this
  }

  public payload(payload?: TPayload) {
    if (payload) {
      this._payload_schemas.push(payload.schema)
      this._payloads.push(assertEx(sortFields<TPayload>(payload)))
    }
    return this
  }

  public hashableFields(): TBoundWitness {
    const addresses = this._accounts.map((account) => account.addressValue.hex)
    const previous_hashes = this._accounts.map((account) => account.previousHash?.hex ?? null)
    return {
      addresses: assertEx(addresses, 'Missing addresses'),
      payload_hashes: assertEx(this._payload_hashes, 'Missing payload_hashes'),
      payload_schemas: assertEx(this._payload_schemas, 'Missing payload_schemas'),
      previous_hashes,
      schema: 'network.xyo.boundwitness',
    } as TBoundWitness
  }

  private signatures(_hash: string) {
    return this._accounts.map((account) => Buffer.from(account.sign(Buffer.from(_hash, 'hex'))).toString('hex'))
  }

  private inlinePayloads() {
    return this._payloads.map<TPayload>((payload, index) => {
      return {
        ...payload,
        schema: this._payload_schemas[index],
      }
    })
  }

  public build(): XyoBoundWitnessWithMeta<TBoundWitness, TPayload> {
    const hashableFields = this.hashableFields()
    const _hash = new XyoHasher(hashableFields).hash

    const ret: XyoBoundWitnessWithMeta<TBoundWitness, TPayload> = {
      ...hashableFields,
      _client: 'js',
      _hash,
      _signatures: this.signatures(_hash),
      _timestamp: Date.now(),
    }
    if (this.config.inlinePayloads) {
      ret._payloads = this.inlinePayloads()
    }
    return ret
  }
}
