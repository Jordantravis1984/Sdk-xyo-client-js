import { GetValidator, PayloadWithPartialMeta } from '@xyo-network/node-core-model'
import { Payload } from '@xyo-network/payload-model'
import { PayloadWrapper } from '@xyo-network/payload-wrapper'
import { XyoSchemaPayload } from '@xyo-network/schema-payload-plugin'
import { XyoSchemaCache } from '@xyo-network/utils'
// eslint-disable-next-line import/no-named-as-default
import Ajv from 'ajv'

const ajv = new Ajv()

export const getPayloadValidatorFromSchemaCache: GetValidator<Payload> = async (payload) => {
  // Get the schema from the schema cache
  const schemaPayload: PayloadWithPartialMeta<XyoSchemaPayload> | undefined = (await XyoSchemaCache.instance.get(payload.schema))?.payload
  // If it doesn't exist return undefined
  if (!schemaPayload) return undefined
  const { definition, _hash } = schemaPayload
  // Use the schema cache payload hash as the AJV cache key to memoize
  // the AJV validator
  const key = _hash || new PayloadWrapper(schemaPayload).hash
  // Check if we already cached the validator
  const validate = ajv.getSchema(key)
  // Return the cached validator for this schema
  if (validate) return validate
  // Otherwise, compile it now
  ajv.addSchema(definition, key)
  // and return it
  return ajv.getSchema(key)
}
