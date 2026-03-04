import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

const DEFAULT_TTL_SEC = 60;

@Injectable()
export class CacheService {
  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.getClient().get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSec = DEFAULT_TTL_SEC): Promise<void> {
    await this.redis.getClient().setex(key, ttlSec, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const client = this.redis.getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  }
}
