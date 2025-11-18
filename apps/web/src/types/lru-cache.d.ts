/**
 * Type declarations for lru-cache
 * Used when @types/lru-cache is not available
 */

declare module 'lru-cache' {
  export interface LRUCacheOptions<K, V> {
    max?: number;
    ttl?: number;
    updateAgeOnGet?: boolean;
    updateAgeOnHas?: boolean;
    allowStale?: boolean;
    dispose?: (value: V, key: K) => void;
    noDisposeOnSet?: boolean;
    length?: (value: V, key: K) => number;
    maxSize?: number;
    ttlResolution?: number;
    ttlAutopurge?: boolean;
    updateAgeOnSet?: boolean;
  }

  export class LRUCache<K, V> {
    constructor(options?: LRUCacheOptions<K, V>);
    get(key: K): V | undefined;
    set(key: K, value: V, options?: { ttl?: number }): this;
    has(key: K): boolean;
    delete(key: K): boolean;
    clear(): void;
    size: number;
  }
}

