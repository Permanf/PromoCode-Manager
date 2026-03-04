import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;
}
