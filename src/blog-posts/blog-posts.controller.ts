import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BlogPostsService } from './blog-posts.service';
import { ViewedHistoryService } from '../viewed-history/viewed-history.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { Request } from 'express';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { UpdateBlogStatusDto } from './dto/update-blog-post-status.dto';
import { PostResponseDto } from './dto/response/blog-post-response.dto';
import { DetailPersonalPostResponseDto } from './dto/response/blog-post-response.dto';
import { DetailCommunityPostResponseDto } from './dto/response/blog-post-response.dto';
import { BlogPostType } from './enums/blog-post-type.enum';

@ApiTags('Blog Posts')
@Controller('blog-posts')
export class BlogPostsController {
  constructor(
    private readonly blogPostsService: BlogPostsService,
    private readonly viewedHistoryService: ViewedHistoryService,
  ) {}

  // ========== REPOST ENDPOINTS ==========
  @Post('repost')
  @ApiOperation({ summary: 'Repost bài viết' })
  @ApiResponse({ status: 201, description: 'Repost thành công' })
  async repost(@Body() dto: CreateBlogPostDto) {
    dto.type = BlogPostType.REPOST;
    return this.blogPostsService.create(dto);
  }

  @Get('repost/check')
  @ApiOperation({ summary: 'Kiểm tra đã repost chưa' })
  @ApiQuery({ name: 'userId', type: Number })
  @ApiQuery({ name: 'originalPostId', type: Number })
  async checkReposted(
    @Query('userId') userId: number,
    @Query('originalPostId') originalPostId: number,
  ) {
    const reposted = await this.blogPostsService.checkReposted(+userId, +originalPostId);
    return { reposted };
  }

  @Delete('repost')
  @ApiOperation({ summary: 'Xóa repost' })
  @ApiQuery({ name: 'userId', type: Number })
  @ApiQuery({ name: 'originalPostId', type: Number })
  async removeRepost(
    @Query('userId') userId: number,
    @Query('originalPostId') originalPostId: number,
  ) {
    return this.blogPostsService.removeRepost(+userId, +originalPostId);
  }

  // ========== CRUD ENDPOINTS ==========
  @Post()
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiResponse({ status: 201, description: 'Tạo bài viết thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(@Body() createBlogPostDto: CreateBlogPostDto): Promise<PostResponseDto> {
    return this.blogPostsService.create(createBlogPostDto);
  }

  @Get()
  findAll() {
    return this.blogPostsService.findAll();
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<DetailPersonalPostResponseDto | DetailCommunityPostResponseDto> {
    const postId = +id;
    console.log('[BlogPostsController] findOne', { postId, user: (req.user as any)?.userId });
    // If user is present, record viewed history (fire-and-forget)
    const userAny = req.user as any;
    if (userAny?.userId) {
      this.viewedHistoryService
        .recordView(Number(userAny.userId), postId)
        .catch((err) => console.error('ViewedHistory.recordView error', err));
    }

    return this.blogPostsService.findOne(postId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bài viết theo ID' })
  @ApiResponse({ status: 200, description: 'Cập nhật bài viết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  update(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto) {
    return this.blogPostsService.update(+id, updateBlogPostDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái bài viết' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBlogStatusDto) {
    return this.blogPostsService.updateStatus(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogPostsService.remove(+id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.blogPostsService.restore(+id);
  }

  @Patch(':id/hide')
  hide(@Param('id') id: string) {
    return this.blogPostsService.hide(+id);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.blogPostsService.publish(+id);
  }

  @Patch(':id/toggle-privacy')
  @ApiOperation({ summary: 'Chuyển đổi chế độ công khai/riêng tư của bài viết' })
  @ApiResponse({ status: 200, description: 'Chuyển đổi chế độ thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  togglePrivacy(@Param('id') id: string) {
    return this.blogPostsService.togglePrivacy(+id);
  }
}
