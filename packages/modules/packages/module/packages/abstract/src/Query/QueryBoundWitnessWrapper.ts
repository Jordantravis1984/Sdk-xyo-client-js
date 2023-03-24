import { assertEx } from '@xylabs/assert'
import { BoundWitnessWrapper } from '@xyo-network/boundwitness-wrapper'
import { XyoQuery, XyoQueryBoundWitness } from '@xyo-network/module-model'
import { Payload, PayloadSetPayload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'

import { QueryBoundWitnessValidator } from './QueryBoundWitnessValidator'

export class QueryBoundWitnessWrapper<T extends XyoQuery = XyoQuery> extends BoundWitnessWrapper<XyoQueryBoundWitness> {
  private _query: PayloadWrapper<T> | undefined
  private _resultSet: PayloadWrapper<PayloadSetPayload> | undefined

  private isQueryBoundWitnessWrapper = true

  override get errors() {
    return new QueryBoundWitnessValidator(this.boundwitness).validate()
  }

  get query() {
    return assertEx(
      (this._query =
        this._query ?? this.payloads[this.boundwitness.query] ? PayloadWrapper.parse<T>(this.payloads[this.boundwitness.query]) : undefined),
      () => `Missing Query [${this.boundwitness}, ${JSON.stringify(this.payloads, null, 2)}]`,
    )
  }

  get resultSet() {
    const resultSetHash = this.boundwitness.resultSet
    return assertEx(
      (this._resultSet =
        this._resultSet ??
        (resultSetHash
          ? this.payloads[resultSetHash]
            ? PayloadWrapper.parse<PayloadSetPayload>(this.payloads[resultSetHash])
            : undefined
          : undefined)),
      () => `Missing resultSet [${resultSetHash}, ${JSON.stringify(this.payloads, null, 2)}]`,
    )
  }

  static parseQuery<T extends XyoQuery = XyoQuery>(obj: unknown, payloads?: Payload[]): QueryBoundWitnessWrapper<T> {
    assertEx(!Array.isArray(obj), 'Array can not be converted to QueryBoundWitnessWrapper')
    switch (typeof obj) {
      case 'object': {
        const castWrapper = obj as QueryBoundWitnessWrapper<T>
        const wrapper = castWrapper?.isQueryBoundWitnessWrapper ? castWrapper : new QueryBoundWitnessWrapper<T>(obj as XyoQueryBoundWitness, payloads)
        if (!wrapper.valid) {
          console.warn(`Parsed invalid QueryBoundWitness ${JSON.stringify(wrapper.errors.map((error) => error.message))}`)
        }
        return wrapper
      }
    }
    throw Error(`Unable to parse [${typeof obj}]`)
  }
}
