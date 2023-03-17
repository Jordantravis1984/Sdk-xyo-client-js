import { PayloadWithMeta } from '@xyo-network/node-core-model'
import { StatusCodes } from 'http-status-codes'

import { request } from '../Server'

export const getPayloadByHash = async (
  token: string,
  archive: string,
  hash: string,
  expectedStatus: StatusCodes = StatusCodes.OK,
): Promise<PayloadWithMeta[]> => {
  const response = await (await request()).get(`/archive/${archive}/payload/hash/${hash}`).auth(token, { type: 'bearer' }).expect(expectedStatus)
  return response.body.data
}
