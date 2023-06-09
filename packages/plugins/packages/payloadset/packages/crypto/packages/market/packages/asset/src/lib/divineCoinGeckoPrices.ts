import { XyoCoingeckoCryptoMarketPayload } from '@xyo-network/coingecko-crypto-market-payload-plugin'
import { AssetInfo, XyoCryptoMarketAssetPayload, XyoCryptoMarketAssetSchema } from '@xyo-network/crypto-asset-payload-plugin'
import { PayloadBuilder } from '@xyo-network/payload-builder'

const schema = XyoCryptoMarketAssetSchema

const valuationExists = (value: [string, Partial<Record<string, number>> | undefined]): value is [string, Partial<Record<string, number>>] => {
  return !!value[1]
}

const otherValueExists = (value: [string, number | undefined]): value is [string, number] => {
  const possiblyNumber = value[1]
  return typeof possiblyNumber === 'number' && !isNaN(possiblyNumber)
}

export const divineCoinGeckoPrices = (payload: XyoCoingeckoCryptoMarketPayload | undefined): XyoCryptoMarketAssetPayload => {
  const assets: Record<string, AssetInfo> =
    payload && payload?.assets
      ? Object.fromEntries(
          Object.entries(payload.assets)
            .filter(valuationExists)
            .map(([asset, valuation]) => {
              const value = Object.fromEntries(
                Object.entries(valuation)
                  .filter(otherValueExists)
                  .map(([symbol, price]) => [symbol.toLowerCase(), price?.toString()]),
              )
              return [asset, { value }]
            }),
        )
      : {}
  const timestamp = Date.now()
  return new PayloadBuilder<XyoCryptoMarketAssetPayload>({ schema }).fields({ assets, timestamp }).build()
}
