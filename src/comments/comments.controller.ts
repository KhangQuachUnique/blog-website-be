import { Controller, Get, Post, Body, Patch, Param, Delete, Query, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, CreateChildCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // Tạo comment gốc
  @Post()
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(createCommentDto);
  }

  // Tạo child comment (reply)
  @Post('reply')
  createReply(@Body() createChildCommentDto: CreateChildCommentDto) {
    return this.commentsService.createChildComment(createChildCommentDto);
  }

  // Lấy tất cả comments của một post
  @Get('post/:postId')
  getPostComments(
    @Param('postId') postId: string,
    @Query('sortBy') sortBy: 'newest' | 'interactions' = 'newest'
  ) {
    return this.commentsService.findCommentsByPost(+postId, sortBy);
  }

  // Lấy tất cả comments của một block
  @Get('block/:blockId')
  getBlockComments(@Param('blockId') blockId: string) {
    return this.commentsService.findCommentsByBlock(+blockId);
  }

  // Lấy chi tiết một comment
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const comment = await this.commentsService.findOne(+id);
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return comment;
  }

  // Đếm child comments
  @Get(':id/count-replies')
  countReplies(@Param('id') id: string) {
    return this.commentsService.countChildComments(+id);
  }

  // Update comment
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentsService.update(+id, updateCommentDto);
    if (!comment) {
      throw new NotFoundException(`Comment with id ${id} not found`);
    }
    return comment;
  }

  // Xóa comment gốc
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commentsService.remove(+id);
  }

  // Xóa child comment
  @Delete('reply/:id')
  removeReply(@Param('id') id: string) {
    return this.commentsService.removeChildComment(+id);
  }
}
