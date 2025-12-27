import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';
import { BlockResponseDto } from '../../../blocks/dto/response/block-response.dto';
import { EBlogPostStatus } from 'src/blog-posts/enums/blog-post-status.enum';
import { BlogPostType } from 'src/blog-posts/enums/blog-post-type.enum';
import { HashtagResponseDto } from 'src/hashtags/dto/response/hashtag-response.dto';
import { UserReactSummaryDto } from 'src/user-reacts/dto/response/user-react-summary.dto';
import { VoteResponseDto } from 'src/user-votes/dto/response/vote-response.dto';

export class CommunityDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'https://example.com/community.jpg' })
  thumbnailUrl: string;

  @Expose()
  @ApiProperty({ example: 'Tech Community' })
  name: string;
}

export class AuthorDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'https://example.com/avatar.jpg' })
  avatarUrl: string;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  username: string;
}

/**
 * Base response DTO for a blog post.
 */
export class PostResponseDto {
  @Expose()
  @Transform(({ value }) => Number(value))
  @ApiProperty({ example: 1 })
  id: number;

  @Expose()
  @ApiProperty({ example: 'My First Blog Post' })
  title: string;

  @Expose()
  @ApiProperty({ example: 'This is a short description of my first blog post.' })
  shortDescription: string;

  @Expose()
  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  thumbnailUrl?: string;

  @Expose()
  @ApiProperty({ example: true })
  isPublic: boolean;

  @Expose()
  @Type(() => AuthorDto)
  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @Expose()
  @ApiProperty({ example: EBlogPostStatus.ACTIVE })
  status: EBlogPostStatus;

  @Expose()
  @ApiProperty({ example: BlogPostType.PERSONAL })
  type: BlogPostType;

  @Expose()
  @Type(() => HashtagResponseDto)
  @ApiProperty({ type: [HashtagResponseDto] })
  hashtags: HashtagResponseDto[];

  @Expose()
  @ApiProperty({
    example: { upvotes: 10, downvotes: 2, userVoted: null },
  })
  votes?: VoteResponseDto;

  @Expose()
  @ApiProperty({ type: UserReactSummaryDto })
  reacts?: UserReactSummaryDto;

  @Expose()
  @ApiProperty({ example: '2024-01-01T12:00:00Z' })
  createdAt: Date;
}

/**
 * Response DTO for a personal blog post.
 */
export class PersonalPostResponseDto extends PostResponseDto {}

/**
 * Response DTO for a community blog post.
 */
export class CommunityPostResponseDto extends PostResponseDto {
  @Expose()
  @Type(() => CommunityDto)
  @ApiPropertyOptional({ type: CommunityDto })
  community?: CommunityDto;
}

/**
 * Response DTO for a repost blog post.
 */
export class RepostPostResponseDto extends PostResponseDto {
  @Expose()
  @Type(() => PostResponseDto)
  @ApiPropertyOptional({ type: PostResponseDto })
  originalPost?: PostResponseDto;
}

/**
 * Detail response DTO with blocks
 */
export class DetailPersonalPostResponseDto extends PersonalPostResponseDto {
  @Expose()
  @Type(() => BlockResponseDto)
  @ApiProperty({
    type: [BlockResponseDto],
    description: 'List of blocks associated with the blog post',
  })
  blocks: BlockResponseDto[];
}

/**
 * Detail response DTO for community blog posts
 */
export class DetailCommunityPostResponseDto extends CommunityPostResponseDto {
  @Expose()
  @Type(() => BlockResponseDto)
  @ApiProperty({
    type: [BlockResponseDto],
    description: 'List of blocks associated with the blog post',
  })
  blocks: BlockResponseDto[];
}
