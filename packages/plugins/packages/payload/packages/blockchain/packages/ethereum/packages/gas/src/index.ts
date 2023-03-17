export * from '@xyo-network/etherchain-gas-ethereum-blockchain-payload-plugins'
export * from '@xyo-network/etherscan-ethereum-gas-payload-plugin'

import { XyoEthereumGasEtherchainPayloadPlugins } from '@xyo-network/etherchain-gas-ethereum-blockchain-payload-plugins'
import { XyoEthereumGasEtherscanPayloadPlugin } from '@xyo-network/etherscan-ethereum-gas-payload-plugin'
import { PayloadPluginFunc } from '@xyo-network/payload-plugin'

export const XyoEthereumGasPayloadPlugins: PayloadPluginFunc[] = [...XyoEthereumGasEtherchainPayloadPlugins, XyoEthereumGasEtherscanPayloadPlugin]

// eslint-disable-next-line import/no-default-export
export default XyoEthereumGasPayloadPlugins
