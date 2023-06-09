import 'source-map-support/register'

import { BoundWitnessMeta, BoundWitnessWithMeta, BoundWitnessWithPartialMeta, PayloadMeta, PayloadWithMeta } from '@xyo-network/node-core-model'

import { BoundWitnessMapResult, flatMapBoundWitness } from '../BoundWitness'
import { augmentWithMetadata } from './augmentWithMetadata'
import { removePayloads } from './removePayloads'

export interface PrepareBoundWitnessesResult {
  payloads: PayloadWithMeta[]
  sanitized: BoundWitnessWithMeta[]
}

export const prepareBoundWitnesses = (
  boundWitnesses: BoundWitnessWithPartialMeta[],
  boundWitnessMetaData: BoundWitnessMeta,
  payloadMetaData: PayloadMeta,
): PrepareBoundWitnessesResult => {
  const flattened: BoundWitnessMapResult = boundWitnesses
    .map(flatMapBoundWitness)
    .reduce((prev, curr) => [prev[0].concat(curr[0]), prev[1].concat(curr[1])], [[], []])
  const sanitized: BoundWitnessWithMeta[] = removePayloads(augmentWithMetadata(flattened[0], boundWitnessMetaData))
  const payloads: PayloadWithMeta[] = augmentWithMetadata(flattened[1], payloadMetaData)
  return { payloads, sanitized }
}
