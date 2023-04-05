import { BoundWitnessWithMeta, PayloadWithMeta, User } from '@xyo-network/node-core-model'
import { BaseMongoSdk } from '@xyo-network/sdk-xyo-mongo-js'
import { AsyncContainerModule, interfaces } from 'inversify'

import { COLLECTIONS } from '../collections'
import { DATABASES } from '../databases'
import { MONGO_TYPES } from '../mongoTypes'
import { getBaseMongoSdk } from './getBaseMongoSdk'
import { addIndexes } from './Indexes'

export const SdkContainerModule = new AsyncContainerModule(async (bind: interfaces.Bind) => {
  await getBaseMongoSdk(COLLECTIONS.Payloads).useMongo(async (client) => {
    await addIndexes(client.db(DATABASES.Archivist))
  })

  // const boundWitnessSdk = getBaseMongoSdk<BoundWitnessWithMeta>(COLLECTIONS.BoundWitnesses)
  // const payloadSdk = getBaseMongoSdk<PayloadWithMeta>(COLLECTIONS.Payloads)
  // const userSdk = getBaseMongoSdk<User>(COLLECTIONS.Users)

  bind<BaseMongoSdk<BoundWitnessWithMeta>>(MONGO_TYPES.BoundWitnessSdk).toDynamicValue(() =>
    getBaseMongoSdk<BoundWitnessWithMeta>(COLLECTIONS.BoundWitnesses),
  )
  bind<BaseMongoSdk<PayloadWithMeta>>(MONGO_TYPES.PayloadSdk).toDynamicValue(() => getBaseMongoSdk<PayloadWithMeta>(COLLECTIONS.Payloads))
  bind<BaseMongoSdk<User>>(MONGO_TYPES.UserSdk).toDynamicValue(() => getBaseMongoSdk<User>(COLLECTIONS.Users))
})
