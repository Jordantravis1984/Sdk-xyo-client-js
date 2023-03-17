import { Payload } from '@xyo-network/payload-model'

export type XyoNetworkNodeType = 'archivist' | 'diviner' | 'bridge' | 'sentinel'

export type XyoNetworkNodeSchema = 'network.xyo.network.node'
export const XyoNetworkNodeSchema: XyoNetworkNodeSchema = 'network.xyo.network.node'

export type XyoNetworkNodePayload = Payload<
  {
    docs?: string
    name?: string
    slug: string
    type: XyoNetworkNodeType
    uri: string
    web?: string
  },
  XyoNetworkNodeSchema
>
