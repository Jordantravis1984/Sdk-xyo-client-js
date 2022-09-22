import { Module, XyoModule } from '@xyo-network/module'

import { Witness } from './Witness'
import { XyoWitness } from './XyoWitness'
import { XyoWitnessWrapper } from './XyoWitnessWrapper'

describe('XyoWitness', () => {
  it('implements Module', async () => {
    const witness: Module = new XyoWitness({ schema: 'xyo.network.test.witness.config', targetSchema: 'xyo.network.test' })
    const wrapper = new XyoWitnessWrapper(witness)
    const payload = await wrapper.observe()
    expect(payload?.schema).toBe('xyo.network.test')
  })
  it('implements XyoModule', async () => {
    const witness: XyoModule = new XyoWitness({ schema: 'xyo.network.test.witness.config', targetSchema: 'xyo.network.test' })
    const wrapper = new XyoWitnessWrapper(witness)
    const payload = await wrapper.observe()
    expect(payload?.schema).toBe('xyo.network.test')
  })
  it('implements Witness', async () => {
    const witness: Witness = new XyoWitness({ schema: 'xyo.network.test.witness.config', targetSchema: 'xyo.network.test' })
    const wrapper = new XyoWitnessWrapper(witness)
    const payload = await wrapper.observe()
    expect(payload?.schema).toBe('xyo.network.test')
  })
})
