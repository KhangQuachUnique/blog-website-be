import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BlogPostsService } from './blog-posts.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { UpdateBlogStatusDto } from './dto/update-blog-post-status.dto';
import { BlogPostType } from './enums/blog-post-type.enum';
import { PostResponseDto } from './dto/response/blog-post-response.dto';

@ApiTags('Blog Posts')
@Controller('blog-posts')
export class BlogPostsController {
  constructor(private readonly blogPostsService: BlogPostsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiResponse({ status: 201, description: 'Tạo bài viết thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(@Body() createBlogPostDto: CreateBlogPostDto): Promise<PostResponseDto> {
    const type = createBlogPostDto.type;
    switch (type) {
      case BlogPostType.PERSONAL:
        return this.blogPostsService.createPersonalPost(createBlogPostDto);
      case BlogPostType.COMMUNITY:
        return this.blogPostsService.createCommunityPost(createBlogPostDto);
      case BlogPostType.REPOST:
        return this.blogPostsService.createRepostBlogPost(createBlogPostDto);
      default:
        throw new Error('Loại bài viết không hợp lệ');
    }
  }

  @Get()
  findAll() {
    return this.blogPostsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blogPostsService.findOne(+id);
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
}
