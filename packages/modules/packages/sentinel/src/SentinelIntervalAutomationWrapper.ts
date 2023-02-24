import { PayloadWrapper } from '@xyo-network/payload-wrapper'

import { SentinelIntervalAutomationPayload } from './Automation'

export class SentinelIntervalAutomationWrapper<
  T extends SentinelIntervalAutomationPayload = SentinelIntervalAutomationPayload,
> extends PayloadWrapper<T> {
  protected get frequencyMillis() {
    if (this.payload.frequency === undefined) return Infinity
    switch (this.payload.frequencyUnits ?? 'hour') {
      case 'minute':
        return this.payload.frequency * 60 * 1000
      case 'hour':
        return this.payload.frequency * 60 * 60 * 1000
      case 'day':
        return this.payload.frequency * 24 * 60 * 60 * 1000
    }
  }

  protected get remaining() {
    //if remaining is not defined, we assume Infinity
    return this.payload.remaining ?? Infinity
  }

  next() {
    this.payload.start = this.payload.start + this.frequencyMillis
    this.consumeRemaining()
    this.checkEnd()
    return this
  }

  protected checkEnd() {
    if (this.payload.start > (this.payload.end ?? Infinity)) {
      this.payload.start = Infinity
    }
  }

  protected consumeRemaining(count = 1) {
    this.payload.remaining = this.remaining - count

    if (this.payload.remaining <= 0) {
      this.payload.start = Infinity
    }
  }
}
