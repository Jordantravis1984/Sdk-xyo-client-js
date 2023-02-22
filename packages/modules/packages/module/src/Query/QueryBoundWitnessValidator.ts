import { BoundWitnessValidator } from '@xyo-network/boundwitness-validator'
import { XyoQuery, XyoQueryBoundWitness, XyoQueryBoundWitnessSchema } from '@xyo-network/module-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'

import { QueryBoundWitnessWrapper } from './QueryBoundWitnessWrapper'

export class QueryBoundWitnessValidator<T extends XyoQuery = XyoQuery> extends BoundWitnessValidator<XyoQueryBoundWitness> {
  private _query: PayloadWrapper<T> | undefined

  private isQueryBoundWitnessValidator = true

  protected override get expectedSchema(): string {
    return XyoQueryBoundWitnessSchema
  }

  public override validate() {
    return [
      ...super.validate(),
      // ...this.validateResultSet()
    ]
  }

  public validateResultSet() {
    const errors: Error[] = []
    const wrapper = new QueryBoundWitnessWrapper(this.obj)
    const required = wrapper.resultSet.payload.required
    if (required) {
      Object.entries(required).forEach(([key, value]) => {
        const found = wrapper.payloadSchemas.reduce((count, schema) => {
          return count + (schema === key ? 1 : 0)
        }, 0)
        if (found !== value) {
          errors.push(Error(`Missing Schema [${key}:${found}:${value}]`))
        }
      })
    }
    return errors
  }
}
