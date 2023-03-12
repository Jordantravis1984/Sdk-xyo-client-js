import { AnyObject } from '@xyo-network/core'
import { XyoPayload } from '@xyo-network/payload-model'
import { XyoWitnessConfig } from '@xyo-network/witness'

export type XyoExternalAddressSchema = 'network.xyo.address.external'
export const XyoExternalAddressSchema = 'network.xyo.address.external'

export type XyoExternalAddress = XyoPayload<{
  address: string
  chain: {
    network: string
    platform: 'ethereum'
  }
  schema: XyoExternalAddressSchema
}>

export type XyoNonFungibleTokenPayload<T extends AnyObject = AnyObject> = XyoPayload<{ schema: 'network.xyo.nft' } & T>

export type XyoContractTermPayload<T extends AnyObject = AnyObject> = XyoPayload<{ schema: 'network.xyo.contract.term' } & T>

export type XyoOwnerContractTermPayload = XyoContractTermPayload<{
  owner?: string
  read?: string | string[]
  write?: string | string[]
}>

export type XyoContractPayload<T extends AnyObject = AnyObject> = XyoPayload<
  { schema: 'network.xyo.contract' } & T & {
      terms?: string[]
    }
>

export type XyoNonFungibleTokenMintPayload = XyoContractPayload<{
  minters?: string[]
  name: string
  schema: 'network.xyo.nft.minter'
  symbol: string
  /** @field array of XyoContractTermPayload hashes */
  terms?: string[]
}>

export type XyoNonFungibleTokenMinterWitnessConfig = XyoWitnessConfig<{
  mint: string
  mintToken?: XyoNonFungibleTokenPayload
  schema: 'network.xyo.nft.minter.query'
}>

export type XyoNonFungibleTokenWitnessConfig = XyoWitnessConfig<XyoNonFungibleTokenPayload>
