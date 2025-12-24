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
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
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
import { JwtUser } from 'src/auth/dto/validate-payload.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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
  @UseGuards(JwtAuthGuard)
  async repost(@Body() dto: CreateBlogPostDto, @Req() req: Request) {
    dto.type = BlogPostType.REPOST;
    // enforce author from JWT
    dto.authorId = (req.user as JwtUser).id;
    return this.blogPostsService.create(dto);
  }

  @Get('repost/check')
  @ApiOperation({ summary: 'Kiểm tra đã repost chưa' })
  @ApiQuery({ name: 'originalPostId', type: Number })
  @UseGuards(JwtAuthGuard)
  async checkReposted(@Query('originalPostId') originalPostId: number, @Req() req: Request) {
    const userId = (req.user as JwtUser).id;
    const reposted = await this.blogPostsService.checkReposted(+userId, +originalPostId);
    return { reposted };
  }

  @Delete('repost')
  @ApiOperation({ summary: 'Xóa repost' })
  @ApiQuery({ name: 'originalPostId', type: Number })
  @UseGuards(JwtAuthGuard)
  async removeRepost(@Query('originalPostId') originalPostId: number, @Req() req: Request) {
    const userId = (req.user as JwtUser).id;
    return this.blogPostsService.removeRepost(+userId, +originalPostId);
  }

  // ========== CRUD ENDPOINTS ==========
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiResponse({ status: 201, description: 'Tạo bài viết thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(
    @Body() createBlogPostDto: CreateBlogPostDto,
    @Req() req: Request,
  ): Promise<PostResponseDto> {
    // enforce author from JWT
    createBlogPostDto.authorId = (req.user as JwtUser).id;
    return this.blogPostsService.create(createBlogPostDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bài viết theo ID' })
  @ApiResponse({ status: 200, description: 'Cập nhật bài viết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateBlogPostDto: UpdateBlogPostDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as JwtUser).id;
    return this.blogPostsService.update(+id, updateBlogPostDto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy tất cả bài viết (Admin)' })
  findAll() {
    return this.blogPostsService.findAll();
  }

  @Get('visible')
  @ApiOperation({ summary: 'Lấy danh sách bài viết hiển thị theo trang và trạng thái' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })

  @ApiQuery({ name: 'status', required: false, type: String, example: 'ALL', description: 'ALL | ACTIVE | HIDDEN' }) 
  findVisible(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,

    @Query('status', new DefaultValuePipe('ALL')) status: string, 
  ) {
    return this.blogPostsService.findVisiblePostsWithPagination(page, limit, status);
  }

  // community
  @Get('community/:communityId')
  async findByCommunity(@Param('communityId') communityId: string) {
    const results = await this.blogPostsService.findByCommunity(+communityId);
    return results;
  }

  @Get('community/:communityId/manage')
  @UseGuards(JwtAuthGuard)
  async findByCommunityManage(
    @Param('communityId') communityId: string,
    @Req() req: Request,
  ): Promise<PostResponseDto[]> {
    const userId = (req.user as JwtUser).id;
    return this.blogPostsService.findByCommunityManage(+communityId, userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<DetailPersonalPostResponseDto | DetailCommunityPostResponseDto> {
    const postId = +id;
    const user = req.user as JwtUser | undefined;
    if (user && user.id) {
      // record viewed history (fire-and-forget)
      this.viewedHistoryService
        .recordView(Number(user.id), postId)
        .catch((err) => console.error('Lỗi ViewedHistory.recordView', err));
    }

    return this.blogPostsService.findOne(postId, user?.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái bài viết' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBlogStatusDto, @Req() req: Request) {
    const userId = (req.user as JwtUser).id;
    return this.blogPostsService.updateStatus(+id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as JwtUser).id;
    return this.blogPostsService.remove(+id, userId);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  restore(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as JwtUser).id;
    return this.blogPostsService.restore(+id, userId);
  }

  @Patch(':id/hide')
  @UseGuards(JwtAuthGuard)
  hide(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as JwtUser).id;
    return this.blogPostsService.hide(+id, userId);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  publish(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as JwtUser).id;
    return this.blogPostsService.publish(+id, userId);
  }

  @Patch(':id/toggle-privacy')
  @ApiOperation({ summary: 'Chuyển đổi chế độ công khai/riêng tư của bài viết' })
  @ApiResponse({ status: 200, description: 'Chuyển đổi chế độ thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @UseGuards(JwtAuthGuard)
  togglePrivacy(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as JwtUser).id;
    return this.blogPostsService.togglePrivacy(+id, userId);
  }
}
