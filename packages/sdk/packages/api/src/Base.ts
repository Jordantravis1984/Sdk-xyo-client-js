import {
  XyoApiConfig,
  XyoApiEnvelope,
  XyoApiError,
  XyoApiReportable,
  XyoApiResponse,
  XyoApiResponseBody,
  XyoApiResponseTuple,
  XyoApiResponseTupleOrBody,
  XyoApiResponseType,
} from '@xyo-network/api-models'
import { AxiosJson } from '@xyo-network/axios'

export class XyoApiBase<C extends XyoApiConfig = XyoApiConfig> implements XyoApiReportable {
  readonly config: C
  protected axios: AxiosJson

  constructor(config: C) {
    this.config = config
    this.axios = new AxiosJson({ ...this.config, headers: this.headers })
  }

  get authenticated() {
    return !!this.config.apiKey || !!this.config.jwtToken
  }

  protected get headers(): Record<string, string> {
    const headers: Record<string, string> = {}
    if (this.config.jwtToken) {
      headers.Authorization = `Bearer ${this.config.jwtToken}`
    }
    if (this.config.apiKey) {
      headers['x-api-key'] = this.config.apiKey
    }
    return headers
  }

  protected get query() {
    return this.config.query ?? ''
  }

  protected get root() {
    return this.config.root ?? '/'
  }

  private static resolveResponse<T>(result?: XyoApiResponse<XyoApiEnvelope<T>>) {
    return [result?.data?.data, result?.data, result] as XyoApiResponseTuple<T>
  }

  private static shapeResponse<T = unknown>(response: XyoApiResponse<XyoApiEnvelope<T>> | undefined, responseType?: XyoApiResponseType) {
    const resolvedResponse = XyoApiBase.resolveResponse(response)
    return responseType === 'tuple' ? resolvedResponse : resolvedResponse[0]
  }

  onError(error: XyoApiError, depth = 0) {
    this.config.reportableParent?.onError?.(error, depth + 1)
    this.config.onError?.(error, depth)
  }

  onFailure(response: XyoApiResponse, depth = 0) {
    this.config.reportableParent?.onFailure?.(response, depth + 1)
    this.config.onFailure?.(response, depth)
  }

  onSuccess(response: XyoApiResponse, depth = 0) {
    this.config.reportableParent?.onSuccess?.(response, depth + 1)
    this.config.onSuccess?.(response, depth)
  }

  protected async deleteEndpoint<T = unknown>(endPoint?: string): Promise<XyoApiResponseBody<T>>
  protected async deleteEndpoint<T = unknown>(endPoint?: string, responseType?: 'body'): Promise<XyoApiResponseBody<T>>
  protected async deleteEndpoint<T = unknown>(endPoint?: string, responseType?: 'tuple'): Promise<XyoApiResponseTuple<T>>
  protected async deleteEndpoint<T = unknown>(endPoint = '', responseType?: XyoApiResponseType): Promise<XyoApiResponseTupleOrBody<T>> {
    const response = await this.monitorResponse<T>(async () => {
      return await this.axios.delete<XyoApiEnvelope<T>, XyoApiResponse<XyoApiEnvelope<T>>>(`${this.resolveRoot()}${endPoint}${this.query}`)
    })
    return XyoApiBase.shapeResponse<T>(response, responseType)
  }

  protected async getEndpoint<T = unknown>(endPoint?: string): Promise<XyoApiResponseBody<T>>
  protected async getEndpoint<T = unknown>(endPoint?: string, responseType?: 'body'): Promise<XyoApiResponseBody<T>>
  protected async getEndpoint<T = unknown>(endPoint?: string, responseType?: 'tuple'): Promise<XyoApiResponseTuple<T>>
  protected async getEndpoint<T = unknown>(endPoint = '', responseType?: XyoApiResponseType): Promise<XyoApiResponseTupleOrBody<T>> {
    const response = await this.monitorResponse<T>(async () => {
      return await this.axios.get<XyoApiEnvelope<T>, XyoApiResponse<XyoApiEnvelope<T>>>(`${this.resolveRoot()}${endPoint}${this.query}`)
    })
    return XyoApiBase.shapeResponse<T>(response, responseType)
  }

  protected handleMonitorResponseError<T>(error: XyoApiError, trapAxiosException: boolean) {
    if (!error.isXyoError) {
      throw error
    }

    if (trapAxiosException) {
      error.response ? this.onFailure(error.response) : this.onError(error)
      if (this.config.throwFailure) {
        throw error
      }
      return error.response as XyoApiResponse<XyoApiEnvelope<T>>
    }
  }

  protected async monitorResponse<T>(closure: () => Promise<XyoApiResponse<XyoApiEnvelope<T>>>) {
    //we use this to prevent accidental catching on exceptions in callbacks
    let trapAxiosException = true
    try {
      const response = await closure()
      trapAxiosException = false

      response.status < 300 ? this.onSuccess(response) : this.onFailure(response)

      return response
    } catch (ex) {
      this.handleMonitorResponseError(ex as XyoApiError, trapAxiosException)
    }
  }

  protected async postEndpoint<T = unknown, D = unknown>(endPoint?: string, data?: D): Promise<XyoApiResponseBody<T>>
  protected async postEndpoint<T = unknown, D = unknown>(endPoint?: string, data?: D, responseType?: 'body'): Promise<XyoApiResponseBody<T>>
  protected async postEndpoint<T = unknown, D = unknown>(endPoint?: string, data?: D, responseType?: 'tuple'): Promise<XyoApiResponseTuple<T>>
  protected async postEndpoint<T = unknown, D = unknown>(
    endPoint = '',
    data?: D,
    responseType?: XyoApiResponseType,
  ): Promise<XyoApiResponseTupleOrBody<T>> {
    const response = await this.monitorResponse<T>(async () => {
      return await this.axios.post<XyoApiEnvelope<T>, XyoApiResponse<XyoApiEnvelope<T>, D>, D>(`${this.resolveRoot()}${endPoint}${this.query}`, data)
    })
    return XyoApiBase.shapeResponse<T>(response, responseType)
  }

  protected async putEndpoint<T = unknown, D = unknown>(endPoint?: string, data?: D): Promise<XyoApiResponseBody<T>>
  protected async putEndpoint<T = unknown, D = unknown>(endPoint?: string, data?: D, responseType?: 'body'): Promise<XyoApiResponseBody<T>>
  protected async putEndpoint<T = unknown, D = unknown>(endPoint?: string, data?: D, responseType?: 'tuple'): Promise<XyoApiResponseTuple<T>>
  protected async putEndpoint<T = unknown, D = unknown>(
    endPoint = '',
    data?: D,
    responseType?: XyoApiResponseType,
  ): Promise<XyoApiResponseTupleOrBody<T>> {
    const response = await this.monitorResponse<T>(async () => {
      return await this.axios.put<XyoApiEnvelope<T>, XyoApiResponse<XyoApiEnvelope<T>, D>, D>(`${this.resolveRoot()}${endPoint}${this.query}`, data)
    })
    return XyoApiBase.shapeResponse<T>(response, responseType)
  }

  private resolveRoot() {
    return `${this.config.apiDomain}${this.root}`
  }
}
