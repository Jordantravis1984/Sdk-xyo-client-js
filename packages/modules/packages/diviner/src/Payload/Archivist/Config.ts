import { XyoArchivist } from '@xyo-network/archivist'
import { XyoPayload } from '@xyo-network/payload'

import { XyoDivinerConfig } from '../../Config'

export type XyoArchivistPayloadDivinerConfigSchema = 'network.xyo.diviner.payload.archivist.config'
export const XyoArchivistPayloadDivinerConfigSchema: XyoArchivistPayloadDivinerConfigSchema = 'network.xyo.diviner.payload.archivist.config'

export type XyoArchivistPayloadDivinerConfig<T extends XyoPayload = XyoPayload> = XyoDivinerConfig<
  T & {
    schema: XyoArchivistPayloadDivinerConfigSchema
    archivist: XyoArchivist
  }
>