import { XyoApiConfig } from '@xyo-network/api-models'
import { ModuleDescription } from '@xyo-network/module-model'

import { XyoApiSimple } from '../../Simple'
import { XyoAddressApi } from './Address'

export class XyoAddressesApi<C extends XyoApiConfig = XyoApiConfig> extends XyoApiSimple<ModuleDescription, C> {
  /**
   * @deprecated Use module API
   */
  public address(address: string): XyoAddressApi {
    return new XyoAddressApi({
      ...this.config,
      root: `${this.root}${address}/`,
    })
  }
}
