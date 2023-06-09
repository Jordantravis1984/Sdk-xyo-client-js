import { Query } from '@xyo-network/module-model'

export type XyoNodeAttachedQuerySchema = 'network.xyo.query.node.attached'
export const XyoNodeAttachedQuerySchema: XyoNodeAttachedQuerySchema = 'network.xyo.query.node.attached'

export type XyoNodeAttachedQuery = Query<{
  schema: XyoNodeAttachedQuerySchema
}>
