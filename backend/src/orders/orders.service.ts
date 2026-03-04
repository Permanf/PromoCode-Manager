import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { PromoUsage, PromoUsageDocument } from './schemas/promo-usage.schema';
import { PromocodesService } from '../promocodes/promocodes.service';
import { UsersService } from '../users/users.service';
import { ClickhouseSyncService } from '../clickhouse/clickhouse-sync.service';
import { LockService } from '../redis/lock.service';
import { CacheService } from '../redis/cache.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApplyPromocodeDto } from './dto/apply-promocode.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(PromoUsage.name) private promoUsageModel: Model<PromoUsageDocument>,
    private promocodesService: PromocodesService,
    private usersService: UsersService,
    private clickhouseSync: ClickhouseSyncService,
    private lockService: LockService,
    private cache: CacheService,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    const order = new this.orderModel({
      userId: new Types.ObjectId(userId),
      amount: dto.amount,
    });
    const saved = await order.save();
    const user = await this.usersService.findById(userId);
    if (user) {
      await this.clickhouseSync
        .syncOrder(saved, user.email, user.name)
        .catch((e) => console.error('CH sync:', e));
    }
    return saved;
  }

  async findByUser(userId: string): Promise<OrderDocument[]> {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<OrderDocument | null> {
    return this.orderModel.findById(id).populate('userId').exec();
  }

  async applyPromocode(
    orderId: string,
    userId: string,
    dto: ApplyPromocodeDto,
  ): Promise<OrderDocument> {
    const promocode = await this.promocodesService.findByCode(dto.code);
    if (!promocode) throw new NotFoundException('Promocode not found');
    const lockKey = `lock:promocode:${promocode._id}`;
    const acquired = await this.lockService.acquire(lockKey);
    if (!acquired) {
      throw new BadRequestException('Promocode is being used. Please retry.');
    }
    try {
      return await this._applyPromocode(orderId, userId, dto.code);
    } finally {
      await this.lockService.release(lockKey);
    }
  }

  private async _applyPromocode(
    orderId: string,
    userId: string,
    code: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId.toString() !== userId) {
      throw new ForbiddenException('Order does not belong to you');
    }
    if (order.promocodeId) {
      throw new BadRequestException('Promocode already applied to this order');
    }

    const promocode = await this.promocodesService.findByCode(code);
    if (!promocode) throw new NotFoundException('Promocode not found');
    if (!promocode.isActive) throw new BadRequestException('Promocode is inactive');

    const now = new Date();
    if (promocode.dateFrom && now < promocode.dateFrom) {
      throw new BadRequestException('Promocode is not yet valid');
    }
    if (promocode.dateTo && now > promocode.dateTo) {
      throw new BadRequestException('Promocode has expired');
    }

    const totalUsages = await this.promoUsageModel
      .countDocuments({ promocodeId: promocode._id })
      .exec();
    if (promocode.totalLimit > 0 && totalUsages >= promocode.totalLimit) {
      throw new BadRequestException('Promocode usage limit reached');
    }

    const userUsages = await this.promoUsageModel
      .countDocuments({ promocodeId: promocode._id, userId: new Types.ObjectId(userId) })
      .exec();
    if (promocode.perUserLimit > 0 && userUsages >= promocode.perUserLimit) {
      throw new BadRequestException('Your usage limit for this promocode has been reached');
    }

    const discountAmount = Math.round(
      (order.amount * promocode.discountPercent) / 100 * 100,
    ) / 100;

    const usage = new this.promoUsageModel({
      orderId: order._id,
      promocodeId: promocode._id,
      userId: new Types.ObjectId(userId),
      discountAmount,
      usedAt: now,
    });
    await usage.save();

    order.promocodeId = promocode._id;
    order.discountAmount = discountAmount;
    await order.save();

    const user = await this.usersService.findById(userId);
    const userEmail = user?.email ?? '';
    const userName = user?.name ?? '';
    await this.clickhouseSync
      .syncOrder(order, userEmail, userName, promocode.code)
      .catch((e) => console.error('CH sync:', e));
    await this.clickhouseSync
      .syncPromoUsage(usage, userEmail, userName, promocode.code)
      .catch((e) => console.error('CH sync:', e));
    this.cache.invalidate('analytics:*').catch(() => {});

    return order;
  }
}
