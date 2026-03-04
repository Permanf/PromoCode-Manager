import { Injectable } from '@nestjs/common';
import { ClickhouseService } from '../clickhouse/clickhouse.service';
import { CacheService } from '../redis/cache.service';
import { createHash } from 'crypto';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserAnalyticsRow {
  id: string;
  email: string;
  name: string;
  phone: string;
  isActive: number;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  promoCodesUsed: number;
}

export interface PromocodeAnalyticsRow {
  id: string;
  code: string;
  discountPercent: number;
  totalLimit: number;
  perUserLimit: number;
  dateFrom: string | null;
  dateTo: string | null;
  isActive: number;
  createdAt: string;
  usageCount: number;
  revenue: number;
  uniqueUsers: number;
}

export interface PromoUsageRow {
  id: string;
  orderId: string;
  promocodeId: string;
  promocodeCode: string;
  userId: string;
  userEmail: string;
  userName: string;
  discountAmount: number;
  usedAt: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly ch: ClickhouseService,
    private readonly cache: CacheService,
  ) {}

  private cacheKey(endpoint: string, params: AnalyticsQueryDto): string {
    const str = JSON.stringify(params);
    const hash = createHash('md5').update(str).digest('hex');
    return `analytics:${endpoint}:${hash}`;
  }

  async getUsers(params: AnalyticsQueryDto): Promise<PaginatedResult<UserAnalyticsRow>> {
    const cacheKey = this.cacheKey('users', params);
    const cached = await this.cache.get<PaginatedResult<UserAnalyticsRow>>(cacheKey);
    if (cached) return cached;

    const page = Number(params.page) || 1;
    const pageSize = Math.min(Number(params.pageSize) || 10, 100);
    const offset = (page - 1) * pageSize;
    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const dateFrom = params.dateFrom ?? '1970-01-01';
    const dateTo = params.dateTo ?? '2100-12-31';

    const client = this.ch.getClient();
    const sortCol = this.safeColumn('users', sortBy);

    const countResult = await client.query({
      query: `SELECT count() as total FROM users`,
      query_params: {},
    });
    const countData = (await countResult.json()) as { data: Array<{ total: string }> };
    const total = Number(countData.data[0]?.total ?? 0);

    const result = await client.query({
      query: `
        SELECT
          u.id,
          u.email,
          u.name,
          u.phone,
          u.isActive,
          u.createdAt,
          coalesce(o.cnt, 0) as totalOrders,
          coalesce(o.spent, 0) as totalSpent,
          coalesce(pu.cnt, 0) as promoCodesUsed
        FROM users u
        LEFT JOIN (
          SELECT userId, count() as cnt, sum(amount - discountAmount) as spent
          FROM orders WHERE createdAt >= {dateFrom:DateTime64} AND createdAt <= {dateTo:DateTime64}
          GROUP BY userId
        ) o ON u.id = o.userId
        LEFT JOIN (
          SELECT userId, count() as cnt FROM promo_usages
          WHERE usedAt >= {dateFrom:DateTime64} AND usedAt <= {dateTo:DateTime64}
          GROUP BY userId
        ) pu ON u.id = pu.userId
        ORDER BY ${sortCol} ${sortOrder}
        LIMIT {limit:UInt32} OFFSET {offset:UInt32}
      `,
      query_params: {
        dateFrom: `${dateFrom} 00:00:00`,
        dateTo: `${dateTo} 23:59:59`,
        limit: pageSize,
        offset,
      },
    });
    const raw = await result.json();
    const rows = Array.isArray(raw) ? raw : (raw as { data?: UserAnalyticsRow[] }).data ?? [];

    const resultData: PaginatedResult<UserAnalyticsRow> = {
      data: rows,
      total,
      page,
      pageSize,
    };
    await this.cache.set(cacheKey, resultData);
    return resultData;
  }

  async getPromocodes(params: AnalyticsQueryDto): Promise<PaginatedResult<PromocodeAnalyticsRow>> {
    const cacheKey = this.cacheKey('promocodes', params);
    const cached = await this.cache.get<PaginatedResult<PromocodeAnalyticsRow>>(cacheKey);
    if (cached) return cached;

    const page = Number(params.page) || 1;
    const pageSize = Math.min(Number(params.pageSize) || 10, 100);
    const offset = (page - 1) * pageSize;
    const sortBy = params.sortBy ?? 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const dateFrom = params.dateFrom ?? '1970-01-01';
    const dateTo = params.dateTo ?? '2100-12-31';

    const client = this.ch.getClient();
    const sortCol = this.safeColumn('promocodes', sortBy);

    const countResult = await client.query({
      query: `SELECT count() as total FROM promocodes`,
      query_params: {},
    });
    const countData = (await countResult.json()) as { data: Array<{ total: string }> };
    const total = Number(countData.data[0]?.total ?? 0);

    const result = await client.query({
      query: `
        SELECT
          p.id,
          p.code,
          p.discountPercent,
          p.totalLimit,
          p.perUserLimit,
          p.dateFrom,
          p.dateTo,
          p.isActive,
          p.createdAt,
          coalesce(pu.usageCount, 0) as usageCount,
          coalesce(pu.revenue, 0) as revenue,
          coalesce(pu.uniqueUsers, 0) as uniqueUsers
        FROM promocodes p
        LEFT JOIN (
          SELECT promocodeId, count() as usageCount, sum(discountAmount) as revenue, uniq(userId) as uniqueUsers
          FROM promo_usages
          WHERE usedAt >= {dateFrom:DateTime64} AND usedAt <= {dateTo:DateTime64}
          GROUP BY promocodeId
        ) pu ON p.id = pu.promocodeId
        ORDER BY ${sortCol} ${sortOrder}
        LIMIT {limit:UInt32} OFFSET {offset:UInt32}
      `,
      query_params: {
        dateFrom: `${dateFrom} 00:00:00`,
        dateTo: `${dateTo} 23:59:59`,
        limit: pageSize,
        offset,
      },
    });
    const raw = await result.json();
    const rows = Array.isArray(raw) ? raw : (raw as { data?: PromocodeAnalyticsRow[] }).data ?? [];

    const resultData: PaginatedResult<PromocodeAnalyticsRow> = {
      data: rows,
      total,
      page,
      pageSize,
    };
    await this.cache.set(cacheKey, resultData);
    return resultData;
  }

  async getPromoUsages(params: AnalyticsQueryDto): Promise<PaginatedResult<PromoUsageRow>> {
    const cacheKey = this.cacheKey('promo-usages', params);
    const cached = await this.cache.get<PaginatedResult<PromoUsageRow>>(cacheKey);
    if (cached) return cached;

    const page = Number(params.page) || 1;
    const pageSize = Math.min(Number(params.pageSize) || 10, 100);
    const offset = (page - 1) * pageSize;
    const sortBy = params.sortBy ?? 'usedAt';
    const sortOrder = params.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const dateFrom = params.dateFrom ?? '1970-01-01';
    const dateTo = params.dateTo ?? '2100-12-31';

    const client = this.ch.getClient();
    const sortCol = this.safeColumn('promo_usages', sortBy);

    const countResult = await client.query({
      query: `
        SELECT count() as total FROM promo_usages
        WHERE usedAt >= {dateFrom:DateTime64} AND usedAt <= {dateTo:DateTime64}
      `,
      query_params: {
        dateFrom: `${dateFrom} 00:00:00`,
        dateTo: `${dateTo} 23:59:59`,
      },
    });
    const countData = (await countResult.json()) as { data: Array<{ total: string }> };
    const total = Number(countData.data[0]?.total ?? 0);

    const result = await client.query({
      query: `
        SELECT id, orderId, promocodeId, promocodeCode, userId, userEmail, userName, discountAmount, usedAt
        FROM promo_usages
        WHERE usedAt >= {dateFrom:DateTime64} AND usedAt <= {dateTo:DateTime64}
        ORDER BY ${sortCol} ${sortOrder}
        LIMIT {limit:UInt32} OFFSET {offset:UInt32}
      `,
      query_params: {
        dateFrom: `${dateFrom} 00:00:00`,
        dateTo: `${dateTo} 23:59:59`,
        limit: pageSize,
        offset,
      },
    });
    const raw = await result.json();
    const rows = Array.isArray(raw) ? raw : (raw as { data?: PromoUsageRow[] }).data ?? [];

    const resultData: PaginatedResult<PromoUsageRow> = {
      data: rows,
      total,
      page,
      pageSize,
    };
    await this.cache.set(cacheKey, resultData);
    return resultData;
  }

  invalidateCache(): void {
    this.cache.invalidate('analytics:*').catch((e) => console.error('Cache invalidation:', e));
  }

  private safeColumn(table: string, col: string): string {
    const allowed: Record<string, string[]> = {
      users: ['id', 'email', 'name', 'createdAt', 'totalOrders', 'totalSpent', 'promoCodesUsed'],
      promocodes: ['id', 'code', 'createdAt', 'usageCount', 'revenue', 'uniqueUsers'],
      promo_usages: ['id', 'usedAt', 'promocodeCode', 'userEmail', 'discountAmount'],
    };
    const cols = allowed[table];
    if (cols && cols.includes(col)) return col;
    return table === 'users' ? 'createdAt' : table === 'promocodes' ? 'createdAt' : 'usedAt';
  }
}
