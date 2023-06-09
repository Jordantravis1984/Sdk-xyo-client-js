import { StringKeyObject } from '@xyo-network/core'
import { Payload } from '@xyo-network/payload-model'

const testSchema = 'network.xyo.test'
const testPayload: Payload<StringKeyObject> = {
  _hash: '20e14207f952a09f767ff614a648546c037fe524ace0bfe55db31f818aff1f1c',
  _timestamp: 1609459255555,
  numberField: 1,
  objectField: {
    numberField: 1,
    stringField: 'stringValue',
  },
  schema: testSchema,
  stringField: 'stringValue',
}

export { testPayload, testSchema }
