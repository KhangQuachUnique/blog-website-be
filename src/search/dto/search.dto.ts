import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

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
}
