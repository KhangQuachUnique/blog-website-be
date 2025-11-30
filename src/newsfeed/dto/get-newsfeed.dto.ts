// src/newsfeed/dto/get-newsfeed.dto.ts

import { IsOptional, IsInt, IsString, Min, Max, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNewsfeedDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 15;

  @IsOptional()
  @IsString()
  after?: string; // cursor base64: "postId|score"

  /**
   * Dành cho người dùng chưa đăng nhập (guest)
   * Frontend sẽ gửi: base64 của JSON.stringify(["#nestjs", "#typescript", "#anime"])
   * Backend sẽ tự decode → không cần login vẫn có feed cá nhân hóa ngon lành
   */
  @IsOptional()
  @IsString()
  @Length(4, 500) // giới hạn độ dài hợp lý, tránh spam
  guestHashtags?: string;
}