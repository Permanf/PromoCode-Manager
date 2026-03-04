import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Promocode, PromocodeSchema } from './schemas/promocode.schema';
import { PromocodesService } from './promocodes.service';
import { PromocodesController } from './promocodes.controller';
import { ClickhouseModule } from '../clickhouse/clickhouse.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Promocode.name, schema: PromocodeSchema }]),
    ClickhouseModule,
  ],
  controllers: [PromocodesController],
  providers: [PromocodesService],
  exports: [PromocodesService],
})
export class PromocodesModule {}
