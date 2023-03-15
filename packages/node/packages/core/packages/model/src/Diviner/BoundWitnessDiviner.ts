import { AbstractDiviner } from '@xyo-network/diviner'
import { XyoQuery } from '@xyo-network/module-model'
import { XyoPayload } from '@xyo-network/payload-model'

import { XyoBoundWitnessDivinerPredicate } from './XyoBoundWitnessDivinerPredicate'

export type BoundWitnessQuerySchema = 'network.xyo.diviner.boundwitness.query'
export const BoundWitnessQuerySchema: BoundWitnessQuerySchema = 'network.xyo.diviner.boundwitness.query'

export type BoundWitnessConfigSchema = 'network.xyo.diviner.boundwitness.config'
export const BoundWitnessConfigSchema: BoundWitnessConfigSchema = 'network.xyo.diviner.boundwitness.config'

export type BoundWitnessQueryPayload = XyoQuery<{ schema: BoundWitnessQuerySchema } & XyoBoundWitnessDivinerPredicate>
export const isBoundWitnessQueryPayload = (x?: XyoPayload | null): x is BoundWitnessQueryPayload => x?.schema === BoundWitnessQuerySchema

export type BoundWitnessDiviner = AbstractDiviner
