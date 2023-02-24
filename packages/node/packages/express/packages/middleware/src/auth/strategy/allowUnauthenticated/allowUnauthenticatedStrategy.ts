import { getHttpHeader } from '@xylabs/sdk-api-express-ecs'
import { Request } from 'express'
import { Strategy, StrategyCreated, StrategyCreatedStatic } from 'passport'

/**
 * Authentication scheme which allows for unauthenticated requests for use in
 * routes which provide a satisfactory experience without being logged in but
 * could also provide a richer experience for users who are logged in. If auth
 * is supplied via API Key or Authorization header, this strategy will fail in
 * deference to those strategies, allowing those strategies to take precedence
 * if supplied.
 */
export class AllowUnauthenticatedStrategy extends Strategy {
  constructor(readonly apiKeyHeader = 'x-api-key') {
    super()
  }

  override authenticate(this: StrategyCreated<this, this & StrategyCreatedStatic>, req: Request, _options?: unknown) {
    try {
      const apiKey = getHttpHeader(this.apiKeyHeader, req)
      if (apiKey) {
        this.fail('API key header supplied')
        return
      }

      const authHeader = req.headers.authorization
      if (authHeader) {
        this.fail('Authorization header supplied')
        return
      }

      this.success(req.user || {})
      return
    } catch (error) {
      this.error({ message: 'AllowUnauthenticated Auth Error' })
    }
  }
}
