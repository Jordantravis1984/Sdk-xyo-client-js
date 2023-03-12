import { deepOmitUnderscoreFields, Hasher, removeEmptyFields } from '@xyo-network/core'
import { XyoPayload } from '@xyo-network/payload-model'

export interface XyoPayloadBuilderOptions {
  schema: string
}

export class XyoPayloadBuilder<T extends XyoPayload = XyoPayload<Record<string, unknown>>> {
  private _fields: Partial<T> = {}
  private _schema: string

  constructor({ schema }: XyoPayloadBuilderOptions) {
    this._schema = schema
  }

  build(): T {
    const hashableFields = this.hashableFields()
    const _hash = new Hasher(hashableFields).hash
    const _timestamp = Date.now()
    return { ...hashableFields, _client: 'js', _hash, _timestamp, schema: this._schema }
  }

  fields(fields?: Partial<T>) {
    if (fields) {
      this._fields = { ...this._fields, ...removeEmptyFields(fields) }
    }
    return this
  }

  hashableFields() {
    return {
      ...removeEmptyFields(deepOmitUnderscoreFields(this._fields)),
      schema: this._schema,
    } as T
  }
}
