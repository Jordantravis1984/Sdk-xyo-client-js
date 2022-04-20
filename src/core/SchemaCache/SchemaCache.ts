import Ajv from 'ajv'
import { JSONSchema4 } from 'json-schema'
import LRU from 'lru-cache'

import { XyoSchemaPayload } from '../../Witnesses'
import { XyoDomainConfigWrapper } from '../DomainConfig'
import { XyoPayload } from '../Payload'

const getSchemaNameFromSchema = (schema: JSONSchema4) => {
  if (schema.properties) {
    const pattern = schema.properties.schema.pattern
    if (pattern?.startsWith('/^') && pattern?.endsWith('$/')) {
      return pattern.substring(2, pattern.length - 2)
    }
  }
}

export class XyoSchemaCache {
  private cache = new LRU<string, XyoPayload | null>({ max: 500, ttl: 1000 * 60 * 5 })

  //Note: there is a race condition in here if two threads (or promises) start a get at the same time, they will both do the discovery
  public async get(schema: string) {
    if (this.cache.get(schema) === undefined) {
      const domain = await XyoDomainConfigWrapper.discover(schema)
      await domain?.fetch()
      const aliases = domain?.aliases
      if (aliases) {
        aliases.forEach((alias) => {
          //check if it is a schema
          if (alias.schema === 'network.xyo.schema') {
            const schema = alias as XyoSchemaPayload
            //only store them if they match the schema root
            if (schema.definition) {
              const ajv = new Ajv()
              //check if it is a valid schema def
              ajv.compile(schema.definition)
              const schemaName = getSchemaNameFromSchema(schema.definition)
              if (schemaName) {
                this.cache.set(schemaName, schema)
              }
            }
          }
        })
      }
      //if it is still undefined, mark it as null (not found)
      if (this.cache.get(schema) === undefined) {
        this.cache.set(schema, null)
      }
    }
    return this.cache.get(schema)
  }

  private static _instance?: XyoSchemaCache
  static get instance() {
    if (!this._instance) {
      this._instance = new XyoSchemaCache()
    }
    return this._instance
  }
}
