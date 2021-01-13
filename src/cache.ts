import cacheManager from 'cache-manager';
import cacheManagerMemoryStore from 'cache-manager/lib/stores/memory';
import redisStore from 'cache-manager-redis-store';

export interface CacheOptions {
  redis?:
    | {
        host?: string;
        port?: number;
        // eslint-disable-next-line camelcase
        auth_pass?: string;
        // eslint-disable-next-line camelcase
        no_ready_check?: boolean;
      }
    | boolean;
  ttl?: number;
}

class Cache {
  private cache: cacheManager.MultiCache;

  private ttl: number;

  constructor(private opts?: CacheOptions) {
    this.ttl = opts?.ttl ?? 3600;

    const memoryCache = cacheManager.caching({
      store: cacheManagerMemoryStore,
      ttl: this.ttl,
    });

    const redisCache = opts?.redis
      ? cacheManager.caching({
          store: redisStore,
          ...(typeof opts?.redis === 'object' ? opts?.redis : {}),
          ttl: this.ttl,
        })
      : null;

    this.cache = cacheManager.multiCaching(
      redisCache ? [memoryCache, redisCache] : [memoryCache],
    );
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
