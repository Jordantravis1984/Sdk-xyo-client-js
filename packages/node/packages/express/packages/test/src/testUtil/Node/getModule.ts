import { assertEx } from '@xylabs/assert'
import { Module } from '@xyo-network/modules'

import { getBridge } from '../Bridge'

export const getModuleByName = async <T extends Module = Module>(name: string): Promise<T> => {
  const modules = await (await getBridge()).downResolver.resolve({ name: [name] })
  expect(modules).toBeArrayOfSize(1)
  const mod = modules.pop()
  expect(mod).toBeTruthy()
  return assertEx(mod) as T
}
