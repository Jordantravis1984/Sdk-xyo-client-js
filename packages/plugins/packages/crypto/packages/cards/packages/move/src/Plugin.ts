import { createXyoPayloadPlugin, XyoPayloadPluginFunc } from '@xyo-network/payload-plugin'

import { XyoCryptoCardsMovePayload } from './Payload'
import { XyoCryptoCardsMovePayloadSchema } from './Schema'
import { XyoXyoCryptoCardsMovePayloadTemplate } from './Template'
import { XyoCryptoCardsMoveWitness } from './Witness'

export const XyoCryptoCardsMovePayloadPlugin: XyoPayloadPluginFunc<XyoCryptoCardsMovePayloadSchema, XyoCryptoCardsMovePayload> = () =>
  createXyoPayloadPlugin({
    auto: true,
    schema: XyoCryptoCardsMovePayloadSchema,
    template: XyoXyoCryptoCardsMovePayloadTemplate,
    witness: (): XyoCryptoCardsMoveWitness => {
      return new XyoCryptoCardsMoveWitness()
    },
  })