import { IsEnum, IsNotEmpty } from 'class-validator';
import { BlogPostStatus } from '../enums/blog-post-status.enum';

export class UpdateBlogStatusDto {
    @IsNotEmpty()
    @IsEnum(BlogPostStatus, {
        message: 'Invalid status',
    })
    status: BlogPostStatus;
}