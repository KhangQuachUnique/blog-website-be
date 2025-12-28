import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtUser } from 'src/auth/dto/validate-payload.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { type Request } from 'express';
import { CommentResponseDto } from './dto/response/comment-response.dto';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // ========== BASIC CRUD ==========

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request,
  ): Promise<CommentResponseDto> {
    const user = req.user as JwtUser;
    console.log(createCommentDto, 'from user', user.id);
    return this.commentsService.create({ userId: user.id, createCommentDto });
  }

  @Get()
  findAll(): Promise<CommentResponseDto[]> {
    return this.commentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CommentResponseDto> {
    return this.commentsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(id);
  }

  // ========== POST/BLOCK COMMENTS ==========

  @Get('post/:postId')
  @UseGuards(OptionalJwtAuthGuard)
  findByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Req() req: Request,
    @Query('sortBy') sortBy?: string,
  ): Promise<CommentResponseDto[]> {
    const currentUserId = (req.user as JwtUser).id;
    return this.commentsService.findByPost(postId, sortBy, currentUserId);
  }

  @Get('block/:blockId')
  @UseGuards(OptionalJwtAuthGuard)
  findByBlock(
    @Param('blockId', ParseIntPipe) blockId: number,
    @Req() req: Request,
  ): Promise<CommentResponseDto[]> {
    const currentUserId = (req.user as JwtUser)?.id;
    return this.commentsService.findByBlock(blockId, currentUserId);
  }

  @Get('post/:postId/count')
  countByPost(@Param('postId', ParseIntPipe) postId: number) {
    return this.commentsService.countByPost(postId);
  }
}
