import { RateLimiter as TokenBucket } from 'limiter';
import { HttpError } from '../../../js-common/errors';

export class RateLimiter {
  private tokenBucket: TokenBucket;

  constructor(tokensPerMinute: number) {
    this.tokenBucket = new TokenBucket(tokensPerMinute, 'minute', true);
  }

  /**
   * One incoming request should make one call to this function
   * If rate limited, error will be thrown
   * @throws HttpError
   */
  public makeRequest() {
    if (!this.tokenBucket.tryRemoveTokens(1)) {
      throw new HttpError('Rate limit on this request has been hit', 429);
    }
    return true;
  }
}
