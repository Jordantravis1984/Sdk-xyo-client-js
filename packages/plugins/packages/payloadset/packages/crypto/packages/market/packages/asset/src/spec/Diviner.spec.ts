import { XyoCryptoMarketAssetPayload, XyoCryptoMarketAssetSchema } from '@xyo-network/crypto-asset-payload-plugin'
import { DivinerWrapper } from '@xyo-network/diviner-wrapper'

import { XyoCryptoMarketAssetDiviner } from '../Diviner'
import { sampleCoinGeckoPayload, sampleUniswapPayload } from '../test'

const coinGeckoPayload = sampleCoinGeckoPayload
const uniswapPayload = sampleUniswapPayload

describe('Diviner', () => {
  test('returns observation', async () => {
    const module = await XyoCryptoMarketAssetDiviner.create()
    const wrapper = DivinerWrapper.wrap(module)

    const payloads = await wrapper.divine([coinGeckoPayload, uniswapPayload])
    expect(payloads).toBeArray()
    expect(payloads.length).toBe(1)
    payloads.map((payload) => {
      if (payload?.schema === XyoCryptoMarketAssetSchema) {
        const assetPayload = payload as XyoCryptoMarketAssetPayload
        expect(assetPayload).toBeObject()
        expect(assetPayload?.assets).toBeObject()
        expect(assetPayload?.schema).toBe(XyoCryptoMarketAssetSchema)
        expect(assetPayload?.timestamp).toBeNumber()
      }
    })
  })
})
