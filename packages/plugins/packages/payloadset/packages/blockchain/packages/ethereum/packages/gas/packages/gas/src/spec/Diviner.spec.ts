import { InfuraProvider } from '@ethersproject/providers'
import { XyoEthereumGasBlocknativeWitness, XyoEthereumGasBlocknativeWitnessConfigSchema } from '@xyo-network/blocknative-ethereum-gas-plugin'
import { DivinerWrapper } from '@xyo-network/diviner-wrapper'
import {
  XyoEtherchainEthereumGasWitnessV2,
  XyoEthereumGasEtherchainV2WitnessConfigSchema,
} from '@xyo-network/etherchain-gas-ethereum-blockchain-plugins'
import { XyoEthereumGasEthersWitness, XyoEthereumGasEthersWitnessConfigSchema } from '@xyo-network/ethers-ethereum-gas-plugin'
import { XyoEthereumGasEtherscanWitness, XyoEthereumGasEtherscanWitnessConfigSchema } from '@xyo-network/etherscan-ethereum-gas-plugin'
import { XyoEthereumGasEthgasstationWitness, XyoEthereumGasEthgasstationWitnessConfigSchema } from '@xyo-network/ethgasstation-ethereum-gas-plugin'
import { XyoEthereumGasPayload, XyoEthereumGasSchema } from '@xyo-network/gas-price-payload-plugin'
import { Payload } from '@xyo-network/payload-model'

import { XyoEthereumGasDiviner } from '../Diviner'
import { sampleBlocknativeGas, sampleEtherchainGasV2, sampleEtherscanGas, sampleEthersGas, sampleEthgasstationGas } from '../test'

describe('Diviner', () => {
  const cases: [title: string, data: Payload[]][] = [
    ['XyoEthereumGasBlocknativePayload', [sampleBlocknativeGas]],
    ['XyoEthereumGasEtherchainV2Payload', [sampleEtherchainGasV2]],
    ['XyoEthereumGasEtherscanPayload', [sampleEtherscanGas]],
    ['XyoEthereumGasEthersPayload', [sampleEthersGas]],
    ['XyoEthereumGasEthgasstationPayload', [sampleEthgasstationGas]],
    ['no gas payloads', []],
    ['all supported gas payloads', [sampleBlocknativeGas, sampleEtherchainGasV2, sampleEtherscanGas, sampleEthersGas, sampleEthgasstationGas]],
  ]
  test.each(cases)('with %s returns divined gas price', async (_title: string, data: Payload[]) => {
    const module = await XyoEthereumGasDiviner.create()
    const wrapper = DivinerWrapper.wrap(module)
    const payloads = await wrapper.divine(data)
    expect(payloads).toBeArray()
    expect(payloads.length).toBe(1)
    const gasPayload = payloads.pop() as XyoEthereumGasPayload
    expect(gasPayload).toBeObject()
    expect(gasPayload.schema).toBe(XyoEthereumGasSchema)
    expect(gasPayload.timestamp).toBeNumber()
    expect(gasPayload.feePerGas).toBeObject()
    expect(gasPayload.priorityFeePerGas).toBeObject()
  })
  test.skip('diviner calibration', async () => {
    // NOTE: This test is for obtaining concurrent witnessed
    // results for diviner weighting/calibration
    const blocknativeGas = (
      await (
        await XyoEthereumGasBlocknativeWitness.create({
          config: {
            schema: XyoEthereumGasBlocknativeWitnessConfigSchema,
          },
        })
      ).observe()
    )?.[0]
    const etherchainGasV2 = (
      await (
        await XyoEtherchainEthereumGasWitnessV2.create({
          config: {
            schema: XyoEthereumGasEtherchainV2WitnessConfigSchema,
          },
        })
      ).observe()
    )?.[0]
    const etherscanGas = (
      await (
        await XyoEthereumGasEtherscanWitness.create({
          config: {
            apiKey: process.env.ETHERSCAN_API_KEY || '',
            schema: XyoEthereumGasEtherscanWitnessConfigSchema,
          },
        })
      ).observe()
    )?.[0]
    const ethersGas = (
      await (
        await XyoEthereumGasEthersWitness.create({
          config: {
            schema: XyoEthereumGasEthersWitnessConfigSchema,
          },
          provider: new InfuraProvider('homestead', {
            projectId: process.env.INFURA_PROJECT_ID,
            projectSecret: process.env.INFURA_PROJECT_SECRET,
          }),
        })
      ).observe()
    )?.[0]
    const ethgasstationGas = (
      await (
        await XyoEthereumGasEthgasstationWitness.create({
          config: {
            schema: XyoEthereumGasEthgasstationWitnessConfigSchema,
          },
        })
      ).observe()
    )?.[0]
    const observations: Payload[] = [blocknativeGas, etherchainGasV2, etherscanGas, ethersGas, ethgasstationGas]

    const module = await XyoEthereumGasDiviner.create()
    const wrapper = DivinerWrapper.wrap(module)

    const payloads = await wrapper.divine(observations)

    expect(payloads).toBeArray()
    expect(payloads.length).toBe(1)
    payloads.map((payload) => {
      if (payload?.schema === XyoEthereumGasSchema) {
        const gasPayload = payload as XyoEthereumGasPayload
        expect(gasPayload).toBeObject()
        expect(gasPayload.schema).toBe(XyoEthereumGasSchema)
        expect(gasPayload.timestamp).toBeNumber()
      }
    })
  })
})
