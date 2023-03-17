import { Archivist } from '@xyo-network/archivist'
import { XyoBoundWitness } from '@xyo-network/boundwitness-model'
import { AbstractModule } from '@xyo-network/module'

import { XyoBoundWitnessWithPartialMeta } from '../BoundWitness'
import { XyoBoundWitnessFilterPredicate } from './BoundWitnessFilterPredicate'

export type BoundWitnessArchivist = Archivist<
  XyoBoundWitnessWithPartialMeta | null,
  XyoBoundWitness | null,
  XyoBoundWitnessWithPartialMeta,
  XyoBoundWitnessWithPartialMeta | null,
  XyoBoundWitnessFilterPredicate,
  string
> &
  AbstractModule
