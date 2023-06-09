import { AnyObject } from './AnyObject'

export type LogFunction = (message?: unknown) => void

/**
 * Interface to handle overlap between Winston &
 * `console` with as much congruency as possible.
 */
export interface Logger {
  debug: LogFunction
  error: LogFunction
  info: LogFunction
  log: LogFunction
  warn: LogFunction
}

export type BaseParamsFields = {
  logger?: Logger
}

export type BaseParams<TAdditionalParams extends AnyObject | undefined = undefined> = TAdditionalParams extends AnyObject
  ? BaseParamsFields & TAdditionalParams
  : BaseParamsFields

export abstract class Base<TParams extends BaseParams = BaseParams> {
  static defaultLogger?: Logger

  constructor(readonly params: TParams) {
    params.logger?.debug(`Base constructed [${Object(this).name}]`)
  }

  protected get logger() {
    return this.params?.logger ?? Base.defaultLogger ?? console
  }
}
