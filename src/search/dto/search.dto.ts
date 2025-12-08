import { IsNotEmpty, IsString } from 'class-validator';

// Model: Quy định dữ liệu đầu vào
export class SearchDto {
  @IsString()
  @IsNotEmpty()
  q: string; // Keyword
}
