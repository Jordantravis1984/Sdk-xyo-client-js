import { XyoBoundWitness } from '@xyo-network/boundwitness'
import { XyoPayload } from '@xyo-network/payload'
import { Promisable } from '@xyo-network/promise'

import { XyoQuery } from './Query'

export type XyoModuleQueryResult<T extends XyoPayload = XyoPayload> = [XyoBoundWitness, (T | null)[]]

export interface _Module<TQuery extends XyoQuery = XyoQuery, TQueryResult extends XyoPayload = XyoPayload> {
  address: string
  queries(): string[]
  queryable: (schema: string) => boolean
  query: <T extends XyoQuery = XyoQuery>(query: T) => Promisable<XyoModuleQueryResult>
}

export interface Module<TQuery extends XyoQuery = XyoQuery> {
  address: string
  queries(): TQuery['schema'][]
  queryable: (schema: string) => boolean
  query: <T extends XyoQuery = XyoQuery>(query: T) => Promisable<XyoModuleQueryResult>
}
