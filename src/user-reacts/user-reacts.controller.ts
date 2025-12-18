import { Controller, Post, Get, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserReactCommandService } from './services/user-react-command.service';
import { UserReactQueryService } from './services/user-react-query.service';
import { ToggleReactDto } from './dto/toggle-react.dto';
import { UserReactSummaryDto } from './dto/response/user-react-summary.dto';

/**
 * 🎯 UserReactsController - RESTful API
 *
 * Design Principles:
 * - Controller KHÔNG chứa business logic
 * - Chỉ mapping DTO ↔ Service
 * - RESTful naming rõ ràng
 * - Swagger documentation đầy đủ
 */
@ApiTags('User Reactions')
@Controller('user-reacts')
export class UserReactsController {
  constructor(
    private readonly commandService: UserReactCommandService,
    private readonly queryService: UserReactQueryService,
  ) {}

  /**
   * Toggle react cho POST
   * - Nếu chưa react: Tạo mới
   * - Nếu đã react: Xóa
   */
  @Post('post/toggle')
  @ApiOperation({
    summary: 'Toggle reaction cho post',
    description: 'Hành vi giống Discord: Click 1 lần = react, click lần 2 = unreact',
  })
  @ApiResponse({ status: 200, description: 'Toggle thành công' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async togglePostReact(@Body() dto: ToggleReactDto): Promise<{ message: string }> {
    await this.commandService.toggleReactForPost(dto);
    return { message: 'Toggle reaction successfully' };
  }

  /**
   * Toggle react cho COMMENT
   */
  @Post('comment/toggle')
  @ApiOperation({
    summary: 'Toggle reaction cho comment',
    description: 'Hành vi giống Discord: Click 1 lần = react, click lần 2 = unreact',
  })
  @ApiResponse({ status: 200, description: 'Toggle thành công' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async toggleCommentReact(@Body() dto: ToggleReactDto): Promise<{ message: string }> {
    await this.commandService.toggleReactForComment(dto);
    return { message: 'Toggle reaction successfully' };
  }

  // ============================================
  // 🔍 QUERY - Read Operations
  // ============================================

  /**
   * Lấy reaction summary cho POST
   * - Aggregate by emoji
   * - Trả về count + isReactedByMe
   */
  @Get('posts/:postId')
  @ApiOperation({
    summary: 'Lấy reactions của post',
    description: 'Trả về danh sách emoji + count + isReactedByCurrentUser',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID để check đã react chưa',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction summary',
    type: UserReactSummaryDto,
  })
  async getPostReactions(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('userId') userId?: string,
  ): Promise<UserReactSummaryDto> {
    const currentUserId = userId ? parseInt(userId, 10) : undefined;
    return this.queryService.getUserReactForPost(postId, currentUserId);
  }

  /**
   * Lấy reaction summary cho COMMENT
   */
  @Get('comments/:commentId')
  @ApiOperation({
    summary: 'Lấy reactions của comment',
    description: 'Trả về danh sách emoji + count + isReactedByCurrentUser',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID để check đã react chưa',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Reaction summary',
    type: UserReactSummaryDto,
  })
  async getCommentReactions(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Query('userId') userId?: string,
  ): Promise<UserReactSummaryDto> {
    const currentUserId = userId ? parseInt(userId, 10) : undefined;
    return this.queryService.getUserReactForComment(commentId, currentUserId);
  }

  /**
   *
   * Use case: Newsfeed cần reactions của 20 posts
   */
  @Get('posts/batch')
  @ApiOperation({
    summary: 'Lấy reactions của nhiều posts (batch query)',
    description: 'Optimize cho newsfeed: 1 query thay vì N queries',
  })
  @ApiQuery({
    name: 'postIds',
    required: true,
    description: 'Array post IDs, cách nhau bởi dấu phẩy (VD: 1,2,3)',
    type: String,
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID để check đã react chưa',
    type: Number,
  })
  async getPostReactionsBatch(
    @Query('postIds') postIds: string,
    @Query('userId') userId?: string,
  ): Promise<{ [key: number]: UserReactSummaryDto }> {
    const postIdArray = postIds.split(',').map((id) => parseInt(id.trim(), 10));
    const currentUserId = userId ? parseInt(userId, 10) : undefined;

    const resultMap = await this.queryService.getUserReactForPosts(postIdArray, currentUserId);

    // Convert Map to plain object for JSON response
    const result: { [key: number]: UserReactSummaryDto } = {};
    resultMap.forEach((value, key) => {
      result[key] = value;
    });

    return result;
  }
}
