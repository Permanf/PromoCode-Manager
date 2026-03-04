import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, ClickHouseClient } from '@clickhouse/client';

@Injectable()
export class ClickhouseService implements OnModuleDestroy {
  private client: ClickHouseClient;

  constructor(private config: ConfigService) {
    const host = this.config.get('CLICKHOUSE_HOST', 'localhost');
    const port = this.config.get('CLICKHOUSE_PORT', '8123');
    const database = this.config.get('CLICKHOUSE_DATABASE', 'promocode');
    this.client = createClient({
      host: `http://${host}:${port}`,
      database,
    });
  }

  getClient(): ClickHouseClient {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.close();
  }
}
