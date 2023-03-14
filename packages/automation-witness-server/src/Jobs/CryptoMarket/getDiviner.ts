import { XyoCryptoMarketAssetDiviner, XyoCryptoMarketAssetDivinerConfigSchema } from '@xyo-network/crypto-asset-plugin'

import { getAccount } from '../../Account'

export const getDiviner = async () => {
  return await XyoCryptoMarketAssetDiviner.create({
    account: getAccount(),
    config: {
      schema: XyoCryptoMarketAssetDivinerConfigSchema,
    },
  })
}
