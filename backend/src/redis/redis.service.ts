import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor(private config: ConfigService) {
    const host = this.config.get('REDIS_HOST', 'localhost');
    const port = this.config.get('REDIS_PORT', '6379');
    this.client = new Redis({
      host,
      port: Number(port),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
