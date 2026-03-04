import { Injectable } from '@nestjs/common';
import { ClickhouseService } from './clickhouse.service';
import { UserDocument } from '../users/schemas/user.schema';
import { PromocodeDocument } from '../promocodes/schemas/promocode.schema';
import { OrderDocument } from '../orders/schemas/order.schema';
import { PromoUsageDocument } from '../orders/schemas/promo-usage.schema';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

async function retry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < RETRY_ATTEMPTS; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < RETRY_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

@Injectable()
export class ClickhouseSyncService {
  constructor(private readonly ch: ClickhouseService) {}

  async syncUser(user: UserDocument): Promise<void> {
    await retry(async () => {
      const client = this.ch.getClient();
      await client.insert({
        table: 'users',
        values: [
          {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            phone: user.phone ?? '',
            isActive: user.isActive ? 1 : 0,
            createdAt: user.createdAt ?? new Date(),
          },
        ],
        format: 'JSONEachRow',
      });
    });
  }

  async syncPromocode(promo: PromocodeDocument): Promise<void> {
    await retry(async () => {
      const client = this.ch.getClient();
      await client.insert({
        table: 'promocodes',
        values: [
          {
            id: promo._id.toString(),
            code: promo.code,
            discountPercent: promo.discountPercent,
            totalLimit: promo.totalLimit,
            perUserLimit: promo.perUserLimit,
            dateFrom: promo.dateFrom ?? null,
            dateTo: promo.dateTo ?? null,
            isActive: promo.isActive ? 1 : 0,
            createdAt: promo.createdAt ?? new Date(),
          },
        ],
        format: 'JSONEachRow',
      });
    });
  }

  async syncOrder(
    order: OrderDocument,
    userEmail: string,
    userName: string,
    promocodeCode?: string,
  ): Promise<void> {
    await retry(async () => {
      const client = this.ch.getClient();
      await client.insert({
        table: 'orders',
        values: [
          {
            id: order._id.toString(),
            userId: order.userId.toString(),
            userEmail,
            userName,
            amount: order.amount,
            promocodeId: order.promocodeId?.toString() ?? '',
            promocodeCode: promocodeCode ?? '',
            discountAmount: order.discountAmount ?? 0,
            createdAt: order.createdAt ?? new Date(),
          },
        ],
        format: 'JSONEachRow',
      });
    });
  }

  async syncPromoUsage(
    usage: PromoUsageDocument,
    userEmail: string,
    userName: string,
    promocodeCode: string,
  ): Promise<void> {
    await retry(async () => {
      const client = this.ch.getClient();
      await client.insert({
        table: 'promo_usages',
        values: [
          {
            id: usage._id.toString(),
            orderId: usage.orderId.toString(),
            promocodeId: usage.promocodeId.toString(),
            promocodeCode,
            userId: usage.userId.toString(),
            userEmail,
            userName,
            discountAmount: usage.discountAmount,
            usedAt: usage.usedAt ?? new Date(),
          },
        ],
        format: 'JSONEachRow',
      });
    });
  }
}
