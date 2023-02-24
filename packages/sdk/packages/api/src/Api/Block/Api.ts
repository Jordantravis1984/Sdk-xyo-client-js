import { XyoApiConfig } from '@xyo-network/api-models'
import { XyoBoundWitness } from '@xyo-network/boundwitness-model'
import { XyoPayload } from '@xyo-network/payload-model'

import { XyoApiSimple } from '../../Simple'
import { WithArchive } from '../../WithArchive'
import { XyoArchivistPayloadApi } from '../Payload'

export class XyoArchivistArchiveBlockApi<
  T extends XyoBoundWitness = XyoBoundWitness,
  C extends WithArchive<XyoApiConfig> = WithArchive<XyoApiConfig>,
> extends XyoArchivistPayloadApi<T, C> {
  /**
   * @deprecated Use module API
   */
  payloads(hash: string): XyoApiSimple<XyoPayload[][]> {
    return new XyoApiSimple<XyoPayload[][]>({
      ...this.config,
      root: `${this.root}hash/${hash}/payloads/`,
    })
  }
}
