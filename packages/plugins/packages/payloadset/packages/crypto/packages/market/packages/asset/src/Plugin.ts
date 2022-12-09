import { XyoCryptoMarketAssetSchema } from '@xyo-network/crypto-asset-payload-plugin'
import { XyoModuleParams } from '@xyo-network/module'
import { PayloadSetSchema } from '@xyo-network/payload'
import { createPayloadSetPlugin, PayloadSetDivinerPlugin } from '@xyo-network/payloadset-plugin'

import { XyoCryptoMarketAssetDiviner, XyoCryptoMarketAssetDivinerConfig } from './Diviner'

export const XyoCryptoMarketAssetPlugin = () =>
  createPayloadSetPlugin<PayloadSetDivinerPlugin<XyoModuleParams<XyoCryptoMarketAssetDivinerConfig>>>(
    { required: { [XyoCryptoMarketAssetSchema]: 1 }, schema: PayloadSetSchema },
    {
      diviner: async (params) => {
        return await XyoCryptoMarketAssetDiviner.create(params)
      },
    },
  )