import { EmptyPayload } from './EmptyPayload'

export type WithTimestamp<T extends EmptyPayload = EmptyPayload> = T & { timestamp: number }

export type PayloadSchema = 'network.xyo.payload'
export const PayloadSchema: PayloadSchema = 'network.xyo.payload'

export type XyoPayloadSchema = PayloadSchema
export const XyoPayloadSchema: XyoPayloadSchema = PayloadSchema

export type SchemaFields = {
  schema: string
}

export type WithSchema<T extends EmptyPayload | void = void> = T extends EmptyPayload ? SchemaFields & T : SchemaFields

export type PayloadFields = {
  sources?: string[]
  timestamp?: number
}

export type WithPayload<T extends EmptyPayload | void = void> = WithSchema<T extends EmptyPayload ? PayloadFields & T : PayloadFields>

export type Payload<
  T extends void | EmptyPayload | WithSchema = void,
  S extends string = T extends WithSchema ? T['schema'] : string,
> = T extends WithSchema
  ? /* Type sent is an XyoPayload */
    WithPayload<T>
  : T extends EmptyPayload
  ? /* Type sent is an Object */
    WithPayload<T & { schema: S }>
  : /* Type sent is void */
    WithPayload<{ schema: S }>

export type XyoPayload<T extends void | EmptyPayload | WithSchema = void, S extends string = T extends WithSchema ? T['schema'] : string> = Payload<
  T,
  S
>
