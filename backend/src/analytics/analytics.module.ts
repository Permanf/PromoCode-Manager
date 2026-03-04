import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { ClickhouseModule } from '../clickhouse/clickhouse.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ClickhouseModule, RedisModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
