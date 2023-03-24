import { Module } from '@xyo-network/modules'
import { TYPES } from '@xyo-network/node-core-types'
import { PrometheusNodeWitness } from '@xyo-network/prometheus-node-plugin'
import { ContainerModule, interfaces } from 'inversify'

let prometheusNodeWitness: PrometheusNodeWitness

const getPrometheusNodeWitness = async (_context: interfaces.Context) => {
  if (prometheusNodeWitness) return prometheusNodeWitness
  prometheusNodeWitness = await PrometheusNodeWitness.create()
  return prometheusNodeWitness
}

export const WitnessContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind(PrometheusNodeWitness).toDynamicValue(getPrometheusNodeWitness).inSingletonScope()
  bind<PrometheusNodeWitness>(TYPES.PrometheusWitness).toDynamicValue(getPrometheusNodeWitness).inSingletonScope()
  bind<Module>(TYPES.Module).toDynamicValue(getPrometheusNodeWitness).inSingletonScope()
})