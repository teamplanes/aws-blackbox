import cacheManager from 'cache-manager';
import redisStore from 'cache-manager-redis-store';

export interface CacheOptions {
  redis?: {
    host?: string;
    port?: number;
    // eslint-disable-next-line camelcase
    auth_pass?: string;
    // eslint-disable-next-line camelcase
    no_ready_check?: boolean;
  };
  ttl?: number;
}

class Cache {
  private cache: cacheManager.MultiCache;

  private ttl: number;

  constructor(private opts?: CacheOptions) {
    this.ttl = opts?.ttl ?? 3600;

    const memoryCache = cacheManager.caching({
      store: 'memory',
      ttl: this.ttl,
    });

    const redisCache = cacheManager.caching({
      store: redisStore,
      ...opts?.redis,
      ttl: this.ttl,
    });

    this.cache = cacheManager.multiCaching([memoryCache, redisCache]);
  }

  /**
   * Set item in cache.
   * @param key
   * @param value
   */
  public set(key: string, value: unknown): Promise<any> {
    return this.cache.set(key, value, {ttl: this.ttl});
  }

  /**
   * Get item from cache.
   * @param key
   */
  public get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  /**
   * Resets the cache
   */
  public async reset(): Promise<void> {
    await new Promise<void>((res) => this.cache.reset(() => res()));
  }
}

export {Cache};
