// src/newsfeed/dto/get-newsfeed.dto.ts
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNewsfeedDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)                   // chống DDoS :)
  limit?: number = 15;

  @IsOptional()
  @IsString()
  after?: string;            // cursor base64
}