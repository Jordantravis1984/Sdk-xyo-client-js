/* eslint-disable max-statements */
import { HDWallet } from '@xyo-network/account'
import { CreatableModuleDictionary, ModuleFactory } from '@xyo-network/module'
import { BoundWitnessWithMeta, JobQueue, PayloadWithMeta } from '@xyo-network/node-core-model'
import { TYPES, WALLET_PATHS } from '@xyo-network/node-core-types'
import { BaseMongoSdk } from '@xyo-network/sdk-xyo-mongo-js'
import { Container } from 'inversify'

import { getBoundWitnessSdk, getPayloadSdk } from '../Mongo'
import { MongoDBAddressHistoryDiviner } from './AddressHistory'
import { MongoDBAddressSpaceDiviner } from './AddressSpace'
import { MongoDBBoundWitnessDiviner } from './BoundWitness'
import { MongoDBBoundWitnessStatsDiviner } from './BoundWitnessStats'
import { MongoDBPayloadDiviner } from './Payload'
import { MongoDBPayloadStatsDiviner } from './PayloadStats'
import { MongoDBSchemaListDiviner } from './SchemaList'
import { MongoDBSchemaStatsDiviner } from './SchemaStats'

const getWallet = (container: Container) => {
  const mnemonic = container.get<string>(TYPES.AccountMnemonic)
  return HDWallet.fromMnemonic(mnemonic)
}

const getMongoDBAddressHistoryDiviner = (container: Container) => {
  const wallet = getWallet(container)
  const boundWitnessSdk: BaseMongoSdk<BoundWitnessWithMeta> = getBoundWitnessSdk()
  const params = {
    accountDerivationPath: WALLET_PATHS.Diviners.AddressHistory,
    boundWitnessSdk,
    config: { name: TYPES.AddressHistoryDiviner.description, schema: MongoDBAddressHistoryDiviner.configSchema },
    wallet,
  }
  return new ModuleFactory(MongoDBAddressHistoryDiviner, params)
}
const getMongoDBAddressSpaceDiviner = (container: Container) => {
  const wallet = getWallet(container)
  const boundWitnessSdk: BaseMongoSdk<BoundWitnessWithMeta> = getBoundWitnessSdk()
  const params = {
    accountDerivationPath: WALLET_PATHS.Diviners.AddressSpace,
    boundWitnessSdk,
    config: { name: TYPES.AddressSpaceDiviner.description, schema: MongoDBAddressSpaceDiviner.configSchema },
    wallet,
  }
  return new ModuleFactory(MongoDBAddressSpaceDiviner, params)
}
const getMongoDBBoundWitnessDiviner = (container: Container) => {
  const wallet = getWallet(container)
  const boundWitnessSdk: BaseMongoSdk<BoundWitnessWithMeta> = getBoundWitnessSdk()
  const params = {
    accountDerivationPath: WALLET_PATHS.Diviners.BoundWitness,
    boundWitnessSdk,
    config: { name: TYPES.BoundWitnessDiviner.description, schema: MongoDBBoundWitnessDiviner.configSchema },
    wallet,
  }
  return new ModuleFactory(MongoDBBoundWitnessDiviner, params)
}
const getMongoDBBoundWitnessStatsDiviner = (container: Container) => {
  const wallet = getWallet(container)
  const boundWitnessSdk: BaseMongoSdk<BoundWitnessWithMeta> = getBoundWitnessSdk()
  const jobQueue = container.get<JobQueue>(TYPES.JobQueue)
  const params = {
    accountDerivationPath: WALLET_PATHS.Diviners.BoundWitnessStats,
    boundWitnessSdk,
    config: { name: TYPES.BoundWitnessStatsDiviner.description, schema: MongoDBBoundWitnessStatsDiviner.configSchema },
    jobQueue,
    wallet,
  }
  return new ModuleFactory(MongoDBBoundWitnessStatsDiviner, params)
}
const getMongoDBPayloadDiviner = (container: Container) => {
  const wallet = getWallet(container)
  const payloadSdk: BaseMongoSdk<PayloadWithMeta> = getPayloadSdk()
  const params = {
    accountDerivationPath: WALLET_PATHS.Diviners.Payload,
    config: { name: TYPES.PayloadDiviner.description, schema: MongoDBPayloadDiviner.configSchema },
    payloadSdk,
    wallet,
  }
  return new ModuleFactory(MongoDBPayloadDiviner, params)
}
const getMongoDBPayloadStatsDiviner = (container: Container) => {
  const wallet = getWallet(container)
  const boundWitnessSdk: BaseMongoSdk<BoundWitnessWithMeta> = getBoundWitnessSdk()
  const jobQueue = container.get<JobQueue>(TYPES.JobQueue)
  const payloadSdk: BaseMongoSdk<PayloadWithMeta> = getPayloadSdk()
  const params = {
    accountDerivationPath: WALLET_PATHS.Diviners.PayloadStats,
    boundWitnessSdk,
    config: { name: TYPES.PayloadStatsDiviner.description, schema: MongoDBPayloadStatsDiviner.configSchema },
    jobQueue,
    payloadSdk,
    wallet,
  }
  return new ModuleFactory(MongoDBPayloadStatsDiviner, params)
}
const getMongoDBSchemaListDiviner = (container: Container) => {
  const wallet = getWallet(container)
  const boundWitnessSdk: BaseMongoSdk<BoundWitnessWithMeta> = getBoundWitnessSdk()
  const params = {
    accountDerivationPath: WALLET_PATHS.Diviners.SchemaList,
    boundWitnessSdk,
    config: { name: TYPES.SchemaListDiviner.description, schema: MongoDBSchemaListDiviner.configSchema },
    wallet,
  }
  return new ModuleFactory(MongoDBSchemaListDiviner, params)
}
const getMongoDBSchemaStatsDiviner = (container: Container) => {
  const wallet = getWallet(container)
  const boundWitnessSdk: BaseMongoSdk<BoundWitnessWithMeta> = getBoundWitnessSdk()
  const jobQueue = container.get<JobQueue>(TYPES.JobQueue)
  const params = {
    accountDerivationPath: WALLET_PATHS.Diviners.SchemaStats,
    boundWitnessSdk,
    config: { name: TYPES.SchemaStatsDiviner.description, schema: MongoDBSchemaStatsDiviner.configSchema },
    jobQueue,
    wallet,
  }
  return new ModuleFactory(MongoDBSchemaStatsDiviner, params)
}

export const addDivinerModuleFactories = (container: Container) => {
  const dictionary = container.get<CreatableModuleDictionary>(TYPES.CreatableModuleDictionary)
  dictionary[MongoDBAddressHistoryDiviner.configSchema] = getMongoDBAddressHistoryDiviner(container)
  dictionary[MongoDBAddressSpaceDiviner.configSchema] = getMongoDBAddressSpaceDiviner(container)
  dictionary[MongoDBBoundWitnessDiviner.configSchema] = getMongoDBBoundWitnessDiviner(container)
  dictionary[MongoDBBoundWitnessStatsDiviner.configSchema] = getMongoDBBoundWitnessStatsDiviner(container)
  dictionary[MongoDBPayloadDiviner.configSchema] = getMongoDBPayloadDiviner(container)
  dictionary[MongoDBPayloadStatsDiviner.configSchema] = getMongoDBPayloadStatsDiviner(container)
  dictionary[MongoDBSchemaListDiviner.configSchema] = getMongoDBSchemaListDiviner(container)
  dictionary[MongoDBSchemaStatsDiviner.configSchema] = getMongoDBSchemaStatsDiviner(container)
}
