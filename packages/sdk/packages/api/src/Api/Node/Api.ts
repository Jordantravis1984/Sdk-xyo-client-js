import { assertEx } from '@xylabs/assert'
import { delay } from '@xylabs/delay'
import { XyoApiConfig, XyoApiResponseTuple } from '@xyo-network/api-models'
import { BoundWitnessBuilder } from '@xyo-network/boundwitness-builder'
import { XyoBoundWitness } from '@xyo-network/boundwitness-model'
import { XyoPayloadBuilder } from '@xyo-network/payload-builder'
import { XyoPayload } from '@xyo-network/payload-model'

import { XyoApiSimple, XyoApiSimpleQuery } from '../../Simple'
import { WithArchive } from '../../WithArchive'

const getRequestStatuses = (results: XyoApiResponseTuple<XyoPayload>[][]): number[] => {
  return results.flat().map((r) => r?.[2]?.status)
}

const allRequestsSucceeded = (results: XyoApiResponseTuple<XyoPayload>[][]): boolean => {
  return getRequestStatuses(results).every((status) => status === 200)
}

const anyRequestsFailed = (results: XyoApiResponseTuple<XyoPayload>[][]): boolean => {
  return getRequestStatuses(results).every((status) => status > 399)
}

export class XyoArchivistNodeApi<
  D extends XyoBoundWitness | XyoBoundWitness[] = XyoBoundWitness | XyoBoundWitness[],
  C extends WithArchive<XyoApiConfig> = WithArchive<XyoApiConfig>,
> extends XyoApiSimple<string[][], D, XyoApiSimpleQuery, C> {
  /**
   * @deprecated Use module API
   * Issue the supplied query and wait (non-blocking) for the result
   * @param data The query to issue
   * @param timeout The max time to wait for the query results
   * @param retryInterval The interval to poll for query results
   * @returns The result for the issued query
   */
  async perform<T extends Partial<XyoPayload>>(data: T, schema: string, timeout = 5000, retryInterval = 100) {
    const payload = new XyoPayloadBuilder({ schema }).fields(data).build()
    const [query] = new BoundWitnessBuilder({ inlinePayloads: true }).payload(payload).build()
    // eslint-disable-next-line deprecation/deprecation
    const result = await this.performTransaction(query as D, timeout, retryInterval)
    return result?.[0]?.[0]
  }

  /**
   * @deprecated Use module API
   * Issue the supplied queries and wait (non-blocking) for the results
   * @param data The queries to issue
   * @param timeout The max time to wait for the query results
   * @param retryInterval The interval to poll for query results
   * @returns The results for the issued queries
   */
  async performTransaction(data: D, timeout = 5000, retryInterval = 100) {
    assertEx(timeout > 0, 'timeout must be positive')
    assertEx(retryInterval > 0, 'retryInterval must be positive')
    assertEx(timeout > retryInterval, 'timeout must be greater than retryInterval')
    const ids = await this.post(data)
    if (!ids?.length) return []
    const loops = Math.floor(timeout / retryInterval)
    let results = [] as XyoApiResponseTuple<XyoPayload>[][]
    for (let i = 0; i < loops; i++) {
      await delay(retryInterval)
      // eslint-disable-next-line deprecation/deprecation
      results = await Promise.all(ids?.map(async (bw) => await Promise.all(bw.map((p) => this.result(p).get('tuple')))))
      if (allRequestsSucceeded(results)) break
      // TODO: More nuanced error handling of partial success/failure
      if (anyRequestsFailed(results)) throw new Error('Request Error')
    }
    // Unpack results
    return results.map((b) => b.map((p) => p[1]))
  }

  /**
   * @deprecated Use module API
   * Get the result of a previously issued query (if available)
   * @param queryId Query ID from a previously issued query
   * @returns The result of the query (if available)
   */
  result<T extends XyoPayload = XyoPayload>(queryId: string): XyoApiSimple<XyoPayload> {
    return new XyoApiSimple<T>({
      ...this.config,
      root: `/query/${queryId}/`,
    })
  }
}
