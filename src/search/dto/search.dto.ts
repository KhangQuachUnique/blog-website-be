import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchType {
  POST = 'post',
  USER = 'user',
  COMMUNITY = 'community',
  HASHTAG = 'hashtag',
}

export class SearchDto {
  @IsString()
  @IsNotEmpty()
  q: string;

  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType;

  // Dùng @Type để ép kiểu từ String (trên URL) sang Number
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  take?: number;
}