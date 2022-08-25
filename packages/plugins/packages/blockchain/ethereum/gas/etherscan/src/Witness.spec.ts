import { XyoAccount } from '@xyo-network/account'

import { XyoEthereumGasEtherscanPayloadSchema, XyoEthereumGasEtherscanWitnessConfigSchema } from './Schema'
import { XyoEtherscanEthereumGasWitness } from './Witness'

const apiKey = process.env.ETHERSCAN_API_KEY || ''

const testIf = (condition: string | undefined) => (condition ? it : it.skip)

describe('Witness', () => {
  testIf(apiKey)('returns observation', async () => {
    const sut = new XyoEtherscanEthereumGasWitness({
      account: new XyoAccount(),
      apiKey,
      schema: XyoEthereumGasEtherscanWitnessConfigSchema,
      targetSchema: XyoEthereumGasEtherscanPayloadSchema,
    })
    const actual = await sut.observe()
    expect(actual.FastGasPrice).toBeString()
    expect(actual.gasUsedRatio).toBeString()
    expect(actual.LastBlock).toBeString()
    expect(actual.ProposeGasPrice).toBeString()
    expect(actual.SafeGasPrice).toBeString()
    expect(actual.suggestBaseFee).toBeString()

    expect(actual.timestamp).toBeNumber()
    expect(actual.schema).toBe(XyoEthereumGasEtherscanPayloadSchema)
  })
})