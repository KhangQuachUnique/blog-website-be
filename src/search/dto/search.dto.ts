import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Định nghĩa các loại tìm kiếm cho phép
export enum SearchType {
  ALL = 'all',      // Tìm tất cả loại
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
  type?: SearchType = SearchType.ALL; // Loại tìm kiếm (mặc định là ALL)
}