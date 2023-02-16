/**
 * @jest-environment jsdom
 */

import { Account } from '@xyo-network/account'
import { SimpleModuleResolver } from '@xyo-network/module'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'

import { MemoryArchivist } from '../MemoryArchivist'
import { StorageArchivistConfigSchema, XyoStorageArchivist } from '../StorageArchivist'
import { testArchivistAll, testArchivistRoundTrip } from './testArchivist'

testArchivistRoundTrip(XyoStorageArchivist.create({ config: { namespace: 'test', schema: StorageArchivistConfigSchema, type: 'local' } }), 'local')
testArchivistRoundTrip(
  XyoStorageArchivist.create({
    config: { namespace: 'test', schema: StorageArchivistConfigSchema, type: 'session' },
  }),
  'session',
)
testArchivistRoundTrip(
  XyoStorageArchivist.create({
    config: { namespace: 'test', schema: StorageArchivistConfigSchema, type: 'page' },
  }),
  'page',
)

testArchivistAll(
  XyoStorageArchivist.create({
    config: { namespace: 'test', schema: StorageArchivistConfigSchema, type: 'local' },
  }),
  'local',
)
testArchivistAll(
  XyoStorageArchivist.create({
    config: { namespace: 'test', schema: StorageArchivistConfigSchema, type: 'session' },
  }),
  'session',
)
testArchivistAll(
  XyoStorageArchivist.create({
    config: { namespace: 'test', schema: StorageArchivistConfigSchema, type: 'page' },
  }),
  'page',
)

test('XyoArchivist Private Key Save', async () => {
  const storage = await XyoStorageArchivist.create({
    config: { namespace: 'test', persistAccount: true, schema: StorageArchivistConfigSchema, type: 'local' },
  })
  const address = storage.address
  const storage2 = await XyoStorageArchivist.create({
    config: { namespace: 'test', persistAccount: true, schema: StorageArchivistConfigSchema, type: 'local' },
  })
  expect(storage2.address).toBe(address)
})

test('XyoArchivist passed account', async () => {
  const account = new Account({ phrase: 'temp' })

  const storage = await XyoStorageArchivist.create({
    account,
    config: { namespace: 'main', persistAccount: true, schema: StorageArchivistConfigSchema, type: 'local' },
  })

  expect(storage['account'].addressValue.hex).toBe(account.addressValue.hex)
})

test('XyoArchivist Parent Write Through', async () => {
  const memory = await MemoryArchivist.create()

  const storage = await XyoStorageArchivist.create({
    config: {
      namespace: 'test',
      parents: { write: [memory.address] },
      persistAccount: true,
      schema: StorageArchivistConfigSchema,
      type: 'local',
    },
    resolver: new SimpleModuleResolver().add(memory),
  })
  await storage.start()

  const wrapper = new PayloadWrapper({ schema: 'network.xyo.test' })

  await storage.insert([wrapper.payload])

  expect((await storage.get([wrapper.hash])).length).toBe(1)
  expect((await memory.get([wrapper.hash])).length).toBe(1)
})