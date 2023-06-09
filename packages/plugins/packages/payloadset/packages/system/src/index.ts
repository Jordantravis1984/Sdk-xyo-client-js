export * from '@xyo-network/info-system-plugins'

import { XyoSystemInfoPlugins } from '@xyo-network/info-system-plugins'
import { PayloadSetPluginFunc } from '@xyo-network/payloadset-plugin'

export const XyoSystemPlugins: PayloadSetPluginFunc[] = [...XyoSystemInfoPlugins]

// eslint-disable-next-line import/no-default-export
export default XyoSystemPlugins
