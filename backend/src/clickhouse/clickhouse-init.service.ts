import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClickhouseService } from './clickhouse.service';

@Injectable()
export class ClickhouseInitService implements OnModuleInit {
  constructor(private readonly ch: ClickhouseService) {}

  async onModuleInit() {
    const client = this.ch.getClient();
    const db = 'promocode';

    await client.command({
      query: `CREATE DATABASE IF NOT EXISTS ${db}`,
    });

    await client.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${db}.users (
          id String,
          email String,
          name String,
          phone String,
          isActive UInt8,
          createdAt DateTime64(3)
        ) ENGINE = ReplacingMergeTree(createdAt) ORDER BY id
      `,
    });

    await client.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${db}.promocodes (
          id String,
          code String,
          discountPercent Float64,
          totalLimit UInt32,
          perUserLimit UInt32,
          dateFrom Nullable(DateTime64(3)),
          dateTo Nullable(DateTime64(3)),
          isActive UInt8,
          createdAt DateTime64(3)
        ) ENGINE = ReplacingMergeTree(createdAt) ORDER BY id
      `,
    });

    await client.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${db}.orders (
          id String,
          userId String,
          userEmail String,
          userName String,
          amount Float64,
          promocodeId String,
          promocodeCode String,
          discountAmount Float64,
          createdAt DateTime64(3)
        ) ENGINE = ReplacingMergeTree(createdAt) ORDER BY id
      `,
    });

    await client.command({
      query: `
        CREATE TABLE IF NOT EXISTS ${db}.promo_usages (
          id String,
          orderId String,
          promocodeId String,
          promocodeCode String,
          userId String,
          userEmail String,
          userName String,
          discountAmount Float64,
          usedAt DateTime64(3)
        ) ENGINE = MergeTree() ORDER BY (usedAt, id)
      `,
    });

    console.log('ClickHouse tables initialized');
  }
}
