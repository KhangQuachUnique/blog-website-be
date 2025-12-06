import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CreateChildCommentDto } from './dto/create-child-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // ========== COMMENT ENDPOINTS ==========

  @Post()
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  findAll() {
    return this.commentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(id);
  }

  // Lấy tất cả comments của một bài viết (type = POST)
  @Get('post/:postId')
  findByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.findByPost(postId);
  }

  // Lấy tất cả comments của một block (type = BLOCK)
  @Get('block/:blockId')
  findByBlock(@Param('blockId', ParseIntPipe) blockId: number) {
    return this.commentsService.findByBlock(blockId);
  }

  // Đếm số comments của một bài viết
  @Get('post/:postId/count')
  countByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.countByPost(postId);
  }

  // ========== CHILD COMMENT (REPLY) ENDPOINTS ==========

  @Post('reply')
  createReply(@Body() createChildCommentDto: CreateChildCommentDto) {
    return this.commentsService.createChildComment(createChildCommentDto);
  }

  @Get('reply/:id')
  findOneReply(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findOneChildComment(id);
  }

  @Patch('reply/:id')
  updateReply(@Param('id', ParseIntPipe) id: number, @Body('content') content: string) {
    return this.commentsService.updateChildComment(id, content);
  }

  @Delete('reply/:id')
  removeReply(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.removeChildComment(id);
  }
}
