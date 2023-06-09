import { AbstractDiviner } from '@xyo-network/abstract-diviner'
import { XyoCoingeckoCryptoMarketPayload, XyoCoingeckoCryptoMarketSchema } from '@xyo-network/coingecko-crypto-market-payload-plugin'
import { XyoCryptoMarketAssetPayload, XyoCryptoMarketAssetSchema } from '@xyo-network/crypto-asset-payload-plugin'
import { DivinerConfig, DivinerModule, DivinerParams } from '@xyo-network/diviner'
import { AnyConfigSchema, Module } from '@xyo-network/module'
import { Payload } from '@xyo-network/payload-model'
import { Promisable } from '@xyo-network/promise'
import { XyoUniswapCryptoMarketPayload, XyoUniswapCryptoMarketSchema } from '@xyo-network/uniswap-crypto-market-payload-plugin'

import { divinePrices } from './lib'
import { XyoCryptoMarketAssetDivinerConfigSchema } from './Schema'

export type XyoCryptoMarketAssetDivinerConfig = DivinerConfig<{ schema: XyoCryptoMarketAssetDivinerConfigSchema }>
export type XyoCryptoMarketAssetDivinerParams = DivinerParams<AnyConfigSchema<XyoCryptoMarketAssetDivinerConfig>>

export class XyoCryptoMarketAssetDiviner<TParams extends XyoCryptoMarketAssetDivinerParams = XyoCryptoMarketAssetDivinerParams>
  extends AbstractDiviner<TParams>
  implements DivinerModule, Module
{
  static override configSchema = XyoCryptoMarketAssetDivinerConfigSchema
  static override targetSchema = XyoCryptoMarketAssetSchema

  override divine(payloads?: Payload[]): Promisable<Payload[]> {
    const coinGeckoPayload = payloads?.find((payload) => payload?.schema === XyoCoingeckoCryptoMarketSchema) as XyoCoingeckoCryptoMarketPayload
    const uniswapPayload = payloads?.find((payload) => payload?.schema === XyoUniswapCryptoMarketSchema) as XyoUniswapCryptoMarketPayload
    const result: XyoCryptoMarketAssetPayload = divinePrices(coinGeckoPayload, uniswapPayload)
    return [result]
  }
}
