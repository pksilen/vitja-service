import ResponseCacheConfigService from '../cache/ResponseCacheConfigService';

export interface ResponseCacheable {
  readonly responseCacheConfigService?: ResponseCacheConfigService;
}
