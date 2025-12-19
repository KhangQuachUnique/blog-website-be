import { IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO để toggle save/unsave post
 * Business logic: Click 1 lần = save, click lần 2 = unsave (giống bookmark)
 */
export class ToggleSavedPostDto {
  @ApiProperty({ example: 1, description: 'ID của user đang thực hiện save' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ example: 123, description: 'ID của post cần save/unsave' })
  @IsNumber()
  @IsNotEmpty()
  postId: number;
}
