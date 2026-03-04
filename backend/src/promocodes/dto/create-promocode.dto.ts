import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePromocodeDto {
  @IsString()
  code: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  discountPercent: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalLimit: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  perUserLimit: number;

  @IsOptional()
  @Type(() => Date)
  dateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  dateTo?: Date;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
