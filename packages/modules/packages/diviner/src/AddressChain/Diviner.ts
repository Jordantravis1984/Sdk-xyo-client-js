import { XyoQuery } from '@xyo-network/module-model'
import { Payload, PayloadFindFilter } from '@xyo-network/payload-model'

import { AbstractDiviner } from '../AbstractDiviner'

export type AddressChainSchema = 'network.xyo.diviner.address.chain'
export const AddressChainSchema: AddressChainSchema = 'network.xyo.diviner.address.chain'

export type AddressChainQuerySchema = 'network.xyo.diviner.address.chain.query'
export const AddressChainQuerySchema: AddressChainQuerySchema = 'network.xyo.diviner.address.chain.query'

export type AddressChainPayload = Payload<{ schema: AddressChainSchema }>
export const isAddressChainPayload = (x?: Payload | null): x is AddressChainPayload => x?.schema === AddressChainSchema

export type AddressChainQueryPayload = XyoQuery<{ schema: AddressChainQuerySchema } & PayloadFindFilter>
export const isAddressChainQueryPayload = (x?: Payload | null): x is AddressChainQueryPayload => x?.schema === AddressChainQuerySchema

export type AddressChainDiviner = AbstractDiviner
