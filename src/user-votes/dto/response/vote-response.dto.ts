import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EVoteType } from '../../entities/user-vote.entity';

/**
 * Response DTO for vote status
 */
export class VoteStatusResponseDto {
  @Expose()
  @ApiProperty({
    enum: EVoteType,
    example: EVoteType.UPVOTE,
    description: 'Loại vote hiện tại của user, null nếu chưa vote',
    nullable: true,
  })
  voteType: EVoteType | null;
}

/**
 * Response DTO for vote action (create, update, delete)
 */
export class VoteActionResponseDto {
  @Expose()
  @ApiProperty({
    example: 'Vote added',
    description: 'Thông báo kết quả hành động',
  })
  message: string;

  @Expose()
  @ApiProperty({
    enum: EVoteType,
    example: EVoteType.UPVOTE,
    description: 'Loại vote sau khi thực hiện hành động, null nếu đã xóa',
    nullable: true,
  })
  voteType: EVoteType | null;

  @Expose()
  @ApiProperty({
    example: 10,
    description: 'Tổng số upvotes của bài viết',
  })
  upVotes: number;

  @Expose()
  @ApiProperty({
    example: 2,
    description: 'Tổng số downvotes của bài viết',
  })
  downVotes: number;
}
