import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // ========== BASIC CRUD ==========

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

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(id);
  }

  // ========== POST/BLOCK COMMENTS ==========

  @Get('post/:postId')
  findByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('sortBy') sortBy?: string // Thêm dòng này để bắt ?sortBy=...
  ) {
    return this.commentsService.findByPost(postId, sortBy);
  }

  @Get('block/:blockId')
  findByBlock(@Param('blockId', ParseIntPipe) blockId: number) {
    return this.commentsService.findByBlock(blockId);
  }

  @Get('post/:postId/count')
  countByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.countByPost(postId);
  }
}