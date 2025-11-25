import { IsEnum, IsNotEmpty } from 'class-validator';
import { EBlogPostStatus } from '../enums/blog-post-status.enum';

export class UpdateBlogStatusDto {
    @IsNotEmpty()
    @IsEnum(EBlogPostStatus, {
        message: 'Invalid status',
    })
    status: EBlogPostStatus;
}