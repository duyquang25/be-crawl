import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryDTO {
  @ApiProperty({ type: Number, required: false, example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset: number;

  @ApiProperty({ type: Number, required: false, example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  limit: number;
}
