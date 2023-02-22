import { XyoEthereumGasEthersSchema } from '@xyo-network/ethers-ethereum-gas-payload-plugin'
import { PayloadSetSchema } from '@xyo-network/payload-model'
import { createPayloadSetPlugin, PayloadSetWitnessPlugin } from '@xyo-network/payloadset-plugin'

import { XyoEthereumGasEthersWitness, XyoEthereumGasEthersWitnessParams } from './Witness'

export const XyoEthereumGasEthersPlugin = () =>
  createPayloadSetPlugin<PayloadSetWitnessPlugin<XyoEthereumGasEthersWitness, XyoEthereumGasEthersWitnessParams>>(
    { required: { [XyoEthereumGasEthersSchema]: 1 }, schema: PayloadSetSchema },
    {
      witness: async (params) => {
        const result = await XyoEthereumGasEthersWitness.create(params)
        return result
      },
    },
  )
