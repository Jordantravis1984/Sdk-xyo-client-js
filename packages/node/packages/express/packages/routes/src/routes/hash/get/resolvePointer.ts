import { BoundWitnessDiviner } from '@xyo-network/diviner-boundwitness-abstract'
import { PayloadDiviner } from '@xyo-network/diviner-payload-abstract'
import { resolveBySymbol } from '@xyo-network/express-node-lib'
import { ArchivistModule } from '@xyo-network/modules'
import { PointerPayload } from '@xyo-network/node-core-model'
import { TYPES } from '@xyo-network/node-core-types'
import { Payload } from '@xyo-network/payload-model'
import { Request } from 'express'

import { findPayload } from './findPayload'

export const resolvePointer = async (req: Request, pointer: PointerPayload): Promise<Payload | undefined> => {
  const { node } = req.app
  const archivist = await resolveBySymbol<ArchivistModule>(node, TYPES.Archivist)
  const boundWitnessDiviner = await resolveBySymbol<BoundWitnessDiviner>(node, TYPES.BoundWitnessDiviner)
  const payloadDiviner = await resolveBySymbol<PayloadDiviner>(node, TYPES.PayloadDiviner)
  return findPayload(archivist, boundWitnessDiviner, payloadDiviner, pointer)
}
