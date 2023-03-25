import { Query } from '@xyo-network/module-model'

export type XyoWitnessObserveQuerySchema = 'network.xyo.query.witness.observe'
export const XyoWitnessObserveQuerySchema: XyoWitnessObserveQuerySchema = 'network.xyo.query.witness.observe'

export type XyoWitnessObserveQuery = Query<{
  payloads?: string[]
  schema: XyoWitnessObserveQuerySchema
}>
