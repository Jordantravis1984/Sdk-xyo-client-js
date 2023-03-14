import { assertEx } from '@xylabs/assert'
import { BoundWitnessBuilder } from '@xyo-network/boundwitness-builder'
import { XyoQuery, XyoQueryBoundWitness, XyoQueryBoundWitnessSchema } from '@xyo-network/module-model'
import { PayloadSetPayload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'

export class QueryBoundWitnessBuilder<
  TBoundWitness extends XyoQueryBoundWitness = XyoQueryBoundWitness,
  TQuery extends XyoQuery = XyoQuery,
> extends BoundWitnessBuilder<TBoundWitness> {
  private _query: PayloadWrapper<TQuery> | undefined
  private _resultSet: PayloadWrapper<PayloadSetPayload> | undefined

  override hashableFields(): TBoundWitness {
    return { ...super.hashableFields(), query: assertEx(this._query?.hash, 'No Query Specified'), schema: XyoQueryBoundWitnessSchema }
  }

  query<T extends TQuery | PayloadWrapper<TQuery>>(query: T) {
    this._query = PayloadWrapper.parse(query)
    this.payload(this._query.payload)
    return this
  }

  resultSet<T extends PayloadSetPayload | PayloadWrapper<PayloadSetPayload>>(payloadSet: T) {
    this._resultSet = PayloadWrapper.parse(payloadSet)
    this.payload(this._resultSet.payload)
    return this
  }
}
