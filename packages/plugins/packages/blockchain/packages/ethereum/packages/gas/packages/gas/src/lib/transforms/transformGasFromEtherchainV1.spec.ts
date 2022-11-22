/* eslint-disable sort-keys-fix/sort-keys-fix */
import { sampleEtherchainGasV1 } from '../../test'
import { transformGasFromEtherchainV1 } from './transformGasFromEtherchainV1'

describe('transformGasFromEtherchainV1', () => {
  it('returns values in the expected format', () => {
    const result = transformGasFromEtherchainV1(sampleEtherchainGasV1)
    expect(result).toBeObject()
    expect(result.baseFee).toBeNumber()
    expect(result.feePerGas).toBeObject()
    expect(result.feePerGas.low).toBeUndefined()
    expect(result.feePerGas.medium).toBeUndefined()
    expect(result.feePerGas.high).toBeUndefined()
    expect(result.feePerGas.veryHigh).toBeUndefined()
    expect(result.priorityFeePerGas).toBeObject()
    expect(result.priorityFeePerGas.low).toBeNumber()
    expect(result.priorityFeePerGas.medium).toBeNumber()
    expect(result.priorityFeePerGas.high).toBeNumber()
    expect(result.priorityFeePerGas.veryHigh).toBeNumber()
  })
  it('matches expected output', () => {
    const result = transformGasFromEtherchainV1(sampleEtherchainGasV1)
    expect(result).toMatchObject({
      baseFee: 19500000000,
      feePerGas: {},
      priorityFeePerGas: {
        low: 100000000,
        medium: 200000000,
        high: 300000000,
        veryHigh: 1500000000,
      },
    })
  })
})
