import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PromoUsageDocument = PromoUsage & Document;

@Schema({ timestamps: true })
export class PromoUsage {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Promocode', required: true })
  promocodeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  discountAmount: number;

  @Prop({ default: () => new Date() })
  usedAt: Date;
}

export const PromoUsageSchema = SchemaFactory.createForClass(PromoUsage);
