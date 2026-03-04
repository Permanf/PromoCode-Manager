import { Module } from '@nestjs/common';
import { ClickhouseService } from './clickhouse.service';
import { ClickhouseSyncService } from './clickhouse-sync.service';
import { ClickhouseInitService } from './clickhouse-init.service';

@Module({
  providers: [ClickhouseService, ClickhouseSyncService, ClickhouseInitService],
  exports: [ClickhouseService, ClickhouseSyncService],
})
export class ClickhouseModule {}
