import { IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EVoteType } from '../entities/user-vote.entity';

export class CreateVoteDto {
  @ApiProperty({ example: 1, description: 'ID của user' })
  @IsNumber()
  userId: number;

  @ApiProperty({ example: 1, description: 'ID của bài viết' })
  @IsNumber()
  postId: number;

  @ApiProperty({ enum: EVoteType, example: 'upvote', description: 'Loại vote' })
  @IsEnum(EVoteType)
  voteType: EVoteType;
}
