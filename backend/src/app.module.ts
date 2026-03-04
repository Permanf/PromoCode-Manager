import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PromocodesModule } from './promocodes/promocodes.module';
import { OrdersModule } from './orders/orders.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ClickhouseModule } from './clickhouse/clickhouse.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/promocode'),
    RedisModule,
    ClickhouseModule,
    AuthModule,
    UsersModule,
    PromocodesModule,
    OrdersModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
