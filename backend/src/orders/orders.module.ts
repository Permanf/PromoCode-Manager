import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { PromoUsage, PromoUsageSchema } from './schemas/promo-usage.schema';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PromocodesModule } from '../promocodes/promocodes.module';
import { UsersModule } from '../users/users.module';
import { ClickhouseModule } from '../clickhouse/clickhouse.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: PromoUsage.name, schema: PromoUsageSchema },
    ]),
    PromocodesModule,
    UsersModule,
    ClickhouseModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
