import { ApiProperty } from '@nestjs/swagger';
import { BlockResponseDto } from 'src/blocks/dto/response/block-response.dto';
import { EBlogPostStatus } from 'src/blog-posts/enums/blog-post-status.enum';
import { HashtagResponseDto } from 'src/hashtags/dto/response/hashtag-response.dto';

class CommunityDto {
  id: number;
  thumnailUrl: string;
  name: string;
}

export class PostResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the blog post' })
  id: number;

  @ApiProperty({ example: 'My First Blog Post', description: 'The title of the blog post' })
  title: string;

  @ApiProperty({
    example: 'This is the content of my first blog post.',
    description: 'The content of the blog post',
  })
  thumbnailUrl?: string;

  @ApiProperty({ example: true, description: 'Indicates if the blog post is public' })
  isPublic: boolean;

  @ApiProperty({ example: 42, description: 'The unique identifier of the author' })
  authorId: number;

  @ApiProperty({ example: EBlogPostStatus.ACTIVE, description: 'The status of the blog post' })
  status: EBlogPostStatus;

  @ApiProperty({ example: 'technology', description: 'The type/category of the blog post' })
  type: string;

  @ApiProperty({
    type: CommunityDto,
    description: 'Community details if the post belongs to a community',
  })
  community?: CommunityDto;

  @ApiProperty({
    type: PostResponseDto,
    description: 'Details of the reposted blog post if this post is a repost',
  })
  repostPost?: PostResponseDto;

  @ApiProperty({
    type: [HashtagResponseDto],
    description: 'List of hashtags associated with the blog post',
  })
  hashtags: HashtagResponseDto[];

  @ApiProperty({
    example: '2024-01-01T12:00:00Z',
    description: 'The creation date of the blog post',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-02T12:00:00Z',
    description: 'The last update date of the blog post',
  })
  updatedAt: Date;
}

export class DetailPostResponseDto extends PostResponseDto {
  @ApiProperty({
    type: [BlockResponseDto],
    description: 'List of blocks associated with the blog post',
  })
  blocks: BlockResponseDto[];
}
