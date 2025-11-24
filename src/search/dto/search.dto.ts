import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

// Định nghĩa các loại tìm kiếm cho phép
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

  @IsEnum(SearchType)
  type: SearchType; // Loại tìm kiếm
}