import { assertEx } from '@xylabs/assert'
import { Account } from '@xyo-network/account'
import { MemoryNode } from '@xyo-network/modules'
import { getBoundWitnessArchivistName, getPayloadArchivistName } from '@xyo-network/node-core-lib'
import {
  ArchiveBoundWitnessArchivist,
  ArchiveBoundWitnessArchivistFactory,
  ArchiveModuleConfig,
  ArchiveModuleConfigSchema,
  ArchivePayloadArchivist,
  ArchivePayloadArchivistFactory,
  ArchivePermissionsArchivist,
  ArchivePermissionsArchivistFactory,
  SetArchivePermissionsPayload,
  XyoBoundWitnessWithMeta,
  XyoPayloadWithMeta,
} from '@xyo-network/node-core-model'
import { TYPES } from '@xyo-network/node-core-types'
import { Logger } from '@xyo-network/shared'
import { ContainerModule, interfaces } from 'inversify'
import LruCache from 'lru-cache'

import { COLLECTIONS } from '../collections'
import { getBaseMongoSdk } from '../Mongo'
import { MongoDBArchiveBoundWitnessArchivist } from './ArchiveBoundWitness'
import { MongoDBArchivePayloadArchivist } from './ArchivePayloads'
import { MongoDBArchivePermissionsPayloadPayloadArchivist } from './ArchivePermissions'

/**
 * The number of most recently used archive archivists to keep
 * in the cache
 */
const max = 1000

const schema = ArchiveModuleConfigSchema

let archivePermissionsArchivistCache: LruCache<string, ArchivePermissionsArchivist> | undefined = undefined
let boundWitnessArchivistCache: LruCache<string, ArchiveBoundWitnessArchivist> | undefined = undefined
let payloadArchivistCache: LruCache<string, ArchivePayloadArchivist> | undefined = undefined

export const ArchivistFactoryContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  archivePermissionsArchivistCache = new LruCache<string, ArchivePermissionsArchivist>({ max })
  boundWitnessArchivistCache = new LruCache<string, ArchiveBoundWitnessArchivist>({ max })
  payloadArchivistCache = new LruCache<string, ArchivePayloadArchivist>({ max })
  bind<ArchiveBoundWitnessArchivistFactory>(TYPES.ArchiveBoundWitnessArchivistFactory).toFactory<Promise<ArchiveBoundWitnessArchivist>, [string]>(
    (context) => {
      return (archive: string) => getBoundWitnessArchivist(context, archive)
    },
  )
  bind<ArchivePayloadArchivistFactory>(TYPES.ArchivePayloadArchivistFactory).toFactory<Promise<ArchivePayloadArchivist>, [string]>((context) => {
    return (archive: string) => getPayloadArchivist(context, archive)
  })
  bind<ArchivePermissionsArchivistFactory>(TYPES.ArchivePermissionsArchivistFactory).toFactory<Promise<ArchivePermissionsArchivist>, [string]>(
    (context) => {
      return (archive: string) => getArchivePermissionsArchivist(context, archive)
    },
  )
})

const getBoundWitnessArchivist = async (context: interfaces.Context, archive: string) => {
  const cached = boundWitnessArchivistCache?.get?.(archive)
  if (cached) return cached
  const config: ArchiveModuleConfig = { archive, schema }
  const sdk = getBaseMongoSdk<XyoBoundWitnessWithMeta>(COLLECTIONS.BoundWitnesses)
  const logger = context.container.get<Logger>(TYPES.Logger)
  const params = { config, logger, sdk }
  const archivist = await MongoDBArchiveBoundWitnessArchivist.create(params)
  const node = context.container.get<MemoryNode>(TYPES.Node)
  node.register(archivist)
  node.attach(archivist.address, getBoundWitnessArchivistName(archive))
  boundWitnessArchivistCache?.set(archive, archivist)
  return archivist
}

const getPayloadArchivist = async (context: interfaces.Context, archive: string) => {
  const cached = payloadArchivistCache?.get?.(archive)
  if (cached) return cached
  const config: ArchiveModuleConfig = { archive, schema }
  const sdk = getBaseMongoSdk<XyoPayloadWithMeta>(COLLECTIONS.Payloads)
  const logger = context.container.get<Logger>(TYPES.Logger)
  const params = { config, logger, sdk }
  const archivist = await MongoDBArchivePayloadArchivist.create(params)
  const node = context.container.get<MemoryNode>(TYPES.Node)
  node.register(archivist)
  node.attach(archivist.address, getPayloadArchivistName(archive))
  payloadArchivistCache?.set(archive, archivist)
  return archivist
}

const getArchivePermissionsArchivist = async (context: interfaces.Context, archive: string) => {
  const cached = archivePermissionsArchivistCache?.get?.(archive)
  if (cached) return cached
  const config: ArchiveModuleConfig = { archive, schema }
  const phrase = assertEx(process.env.ACCOUNT_SEED)
  const account = new Account({ phrase })
  const boundWitnesses = getBaseMongoSdk<XyoBoundWitnessWithMeta>(COLLECTIONS.BoundWitnesses)
  const payloads = getBaseMongoSdk<XyoPayloadWithMeta<SetArchivePermissionsPayload>>(COLLECTIONS.Payloads)
  const params = { account, boundWitnesses, config, payloads }
  const archivist = await MongoDBArchivePermissionsPayloadPayloadArchivist.create(params)
  archivePermissionsArchivistCache?.set(archive, archivist)
  return archivist
}