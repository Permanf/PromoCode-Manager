import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

const LOCK_TTL_MS = 10000; // 10 seconds

@Injectable()
export class LockService {
  constructor(private readonly redis: RedisService) {}

  async acquire(key: string, ttlMs = LOCK_TTL_MS): Promise<boolean> {
    const client = this.redis.getClient();
    const result = await client.set(key, '1', 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  async release(key: string): Promise<void> {
    await this.redis.getClient().del(key);
  }

  async withLock<T>(key: string, fn: () => Promise<T>, ttlMs = LOCK_TTL_MS): Promise<T> {
    const acquired = await this.acquire(key, ttlMs);
    if (!acquired) {
      throw new Error('Could not acquire lock');
    }
    try {
      return await fn();
    } finally {
      await this.release(key);
    }
  }
}
