import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BlockResponseDto } from 'src/blocks/dto/response/block-response.dto';
import { EBlogPostStatus } from 'src/blog-posts/enums/blog-post-status.enum';
import { BlogPostType } from 'src/blog-posts/enums/blog-post-type.enum';
import { HashtagResponseDto } from 'src/hashtags/dto/response/hashtag-response.dto';

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
  @ApiProperty({ type: [HashtagResponseDto] })
  hashtags: HashtagResponseDto[];

  @Expose()
  @ApiProperty({ example: 150 })
  votes: number;

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
  @ApiPropertyOptional({ type: CommunityDto })
  community?: CommunityDto;
}

/**
 * Response DTO for a repost blog post.
 */
export class RepostPostResponseDto extends PostResponseDto {
  @Expose()
  @ApiPropertyOptional({ type: PostResponseDto })
  originalPost?: PostResponseDto;
}

/**
 * Detail response DTO with blocks
 */
export class DetailPersonalPostResponseDto extends PersonalPostResponseDto {
  @Expose()
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
  @ApiProperty({
    type: [BlockResponseDto],
    description: 'List of blocks associated with the blog post',
  })
  blocks: BlockResponseDto[];
}
