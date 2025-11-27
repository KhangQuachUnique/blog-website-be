import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BlogPostsService } from './blog-posts.service';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { UpdateBlogStatusDto } from './dto/update-blog-post-status.dto';

@Controller('blog-posts')
export class BlogPostsController {
  constructor(private readonly blogPostsService: BlogPostsService) {}

  @Post()
  create(@Body() createBlogPostDto: CreateBlogPostDto) {
    return this.blogPostsService.create(createBlogPostDto);
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
  update(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto) {
    return this.blogPostsService.update(+id, updateBlogPostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.blogPostsService.remove(+id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() updateBlogStatusDto: UpdateBlogStatusDto) {
    return this.blogPostsService.updateStatus(+id, updateBlogStatusDto);
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
}
