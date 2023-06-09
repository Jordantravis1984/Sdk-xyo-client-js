export * from '@xyo-network/bowser-system-info-payload-plugin'

import { XyoBowserSystemInfoPlugin } from '@xyo-network/bowser-system-info-plugin'
import { XyoNodeSystemInfoPlugin } from '@xyo-network/node-system-info-plugin'
import { PayloadSetPluginFunc } from '@xyo-network/payloadset-plugin'

export const XyoSystemInfoPlugins: PayloadSetPluginFunc[] = [XyoBowserSystemInfoPlugin, XyoNodeSystemInfoPlugin]

// eslint-disable-next-line import/no-default-export
export default XyoSystemInfoPlugins
