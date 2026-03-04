import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromocodeDocument = Promocode & Document;

@Schema({ timestamps: true })
export class Promocode {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  discountPercent: number;

  @Prop({ required: true, default: 0 })
  totalLimit: number;

  @Prop({ required: true, default: 0 })
  perUserLimit: number;

  @Prop()
  dateFrom?: Date;

  @Prop()
  dateTo?: Date;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PromocodeSchema = SchemaFactory.createForClass(Promocode);
