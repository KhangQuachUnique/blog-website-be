import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SavedPostListService } from './saved-post-list.service';
import { ToggleSavedPostDto } from './dto/toggle-saved-post.dto';
import {
  SavedPostListResponseDto,
  ToggleSavedPostResponseDto,
  CheckSavedResponseDto,
  BatchCheckSavedResponseDto,
} from './dto/response/saved-post-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * 🔖 SavedPostListController
 * 
 * Endpoints:
 * - POST /saved-posts/toggle      : Toggle save/unsave post
 * - GET  /saved-posts/check       : Check if post is saved
 * - GET  /saved-posts/batch-check : Batch check multiple posts
 * - GET  /saved-posts/user/:userId: Get user's saved posts
 * - GET  /saved-posts/count       : Get saved posts count
 * - DELETE /saved-posts/:itemId   : Remove saved post item
 */
@ApiTags('Saved Posts')
@Controller('saved-posts')
export class SavedPostListController {
  constructor(private readonly savedPostService: SavedPostListService) {}

  /**
   * 🔄 Toggle save/unsave post (bookmark)
   */
  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle save/unsave post (bookmark)' })
  @ApiResponse({
    status: 200,
    description: 'Post saved/unsaved successfully',
    type: ToggleSavedPostResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User or Post not found' })
  async toggleSave(
    @Body() dto: ToggleSavedPostDto,
  ): Promise<ToggleSavedPostResponseDto> {
    return this.savedPostService.toggleSavePost(dto);
  }

  /**
   * ✅ Check if a post is saved by user
   */
  @Get('check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if post is saved by user' })
  @ApiQuery({ name: 'userId', type: Number, required: true })
  @ApiQuery({ name: 'postId', type: Number, required: true })
  @ApiResponse({
    status: 200,
    description: 'Returns saved status',
    type: CheckSavedResponseDto,
  })
  async checkSaved(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('postId', ParseIntPipe) postId: number,
  ): Promise<CheckSavedResponseDto> {
    const isSaved = await this.savedPostService.checkIfSaved(userId, postId);
    return { isSaved };
  }

  /**
   * ✅ Batch check: Check multiple posts at once
   */
  @Get('batch-check')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Batch check if multiple posts are saved' })
  @ApiQuery({ name: 'userId', type: Number, required: true })
  @ApiQuery({
    name: 'postIds',
    type: String,
    required: true,
    description: 'Comma-separated post IDs (e.g., 1,2,3)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns map of postId -> isSaved',
    type: BatchCheckSavedResponseDto,
  })
  async batchCheckSaved(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('postIds') postIdsStr: string,
  ): Promise<BatchCheckSavedResponseDto> {
    const postIds = postIdsStr
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    return this.savedPostService.batchCheckSaved(userId, postIds);
  }

  /**
   * 📋 Get user's saved posts (paginated)
   */
  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user's saved posts with pagination" })
  @ApiParam({ name: 'userId', type: Number })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated saved posts',
    type: SavedPostListResponseDto,
  })
  async getUserSavedPosts(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<SavedPostListResponseDto> {
    return this.savedPostService.getSavedPostsByUser(userId, page, limit);
  }

  /**
   * 📊 Get total count of saved posts
   */
  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get total count of saved posts for user' })
  @ApiQuery({ name: 'userId', type: Number, required: true })
  @ApiResponse({
    status: 200,
    description: 'Returns count',
  })
  async getSavedPostsCount(
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<{ count: number }> {
    const count = await this.savedPostService.getSavedPostsCount(userId);
    return { count };
  }

  /**
   * 🗑️ Remove saved post by item ID
   */
  @Delete(':itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a saved post item' })
  @ApiParam({ name: 'itemId', type: Number })
  @ApiQuery({ name: 'userId', type: Number, required: true })
  @ApiResponse({ status: 200, description: 'Saved post removed' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async removeSavedPost(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Query('userId', ParseIntPipe) userId: number,
  ): Promise<{ message: string }> {
    await this.savedPostService.removeSavedPost(userId, itemId);
    return { message: 'Đã xóa bài viết khỏi danh sách lưu' };
  }
}
