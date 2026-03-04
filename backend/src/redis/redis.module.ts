import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LockService } from './lock.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [RedisService, LockService, CacheService],
  exports: [RedisService, LockService, CacheService],
})
export class RedisModule {}
