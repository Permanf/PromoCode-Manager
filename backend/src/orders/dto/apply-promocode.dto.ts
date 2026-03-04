import { IsString, MinLength } from 'class-validator';

export class ApplyPromocodeDto {
  @IsString()
  @MinLength(1)
  code: string;
}
