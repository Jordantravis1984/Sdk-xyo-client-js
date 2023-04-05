import { Archivist, ArchivistModule, ArchivistParams } from '@xyo-network/archivist'
import { BoundWitness } from '@xyo-network/boundwitness-model'
import { AnyObject } from '@xyo-network/core'

import { PayloadWithMeta, PayloadWithPartialMeta } from '../Payload'
import { PayloadFilterPredicate } from './PayloadFilterPredicate'

export type PayloadArchivist<T extends AnyObject = AnyObject, TParams extends ArchivistParams = ArchivistParams> = Archivist<
  PayloadWithMeta<T> | null,
  BoundWitness | null,
  PayloadWithPartialMeta<T>,
  PayloadWithMeta<T> | null,
  PayloadFilterPredicate<T>,
  string
> &
  ArchivistModule<TParams>
