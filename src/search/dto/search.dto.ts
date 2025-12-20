import { IsNotEmpty, IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchType {
  POST = 'post',
  USER = 'user',
  COMMUNITY = 'community',
  HASHTAG = 'hashtag',
}

// Model: Quy định dữ liệu đầu vào
export class SearchDto {
  @IsString()
  @IsNotEmpty()
  q: string; // Keyword

  @IsOptional()
  @IsEnum(SearchType)
  type?: SearchType; // Optional: filter by type

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 15; // Số lượng kết quả mỗi trang

  @IsOptional()
  @IsString()
  after?: string; // Cursor để phân trang (base64 encoded)
}
