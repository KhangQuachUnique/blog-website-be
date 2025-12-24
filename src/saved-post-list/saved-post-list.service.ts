import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { SavedPostList } from './entities/saved-post-list.entity';
import { SavedPostListItem } from './entities/saved-post-list-item.entity';
import { User } from '../users/entities/user.entity';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { ToggleSavedPostDto } from './dto/toggle-saved-post.dto';
import {
  SavedPostListResponseDto,
  ToggleSavedPostResponseDto,
  BatchCheckSavedResponseDto,
} from './dto/response/saved-post-response.dto';
import { UserVotesService } from 'src/user-votes/user-votes.service';
import { UserReactQueryService } from 'src/user-reacts/services/user-react-query.service';
import { PostResponseDto } from 'src/blog-posts/dto/response/blog-post-response.dto';
import { plainToInstance } from 'class-transformer';

/**
 * 🔖 SavedPostListService
 *
 * Business Logic:
 * - Toggle save/unsave (bookmark style)
 * - Get saved posts với pagination
 * - Check if post is saved (single & batch)
 *
 * Design Pattern:
 * - Information Expert: Service biết cách xử lý saved posts
 * - Low Coupling: Chỉ phụ thuộc vào repositories cần thiết
 */
@Injectable()
export class SavedPostListService {
  constructor(
    private readonly userVotesService: UserVotesService,

    private readonly userReactsService: UserReactQueryService,

    @InjectRepository(SavedPostList)
    private savedPostListRepo: Repository<SavedPostList>,

    @InjectRepository(SavedPostListItem)
    private savedPostItemRepo: Repository<SavedPostListItem>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(BlogPost)
    private postRepo: Repository<BlogPost>,
  ) {}

  /**
   * 🔄 Toggle save/unsave post
   * - Nếu đã save → unsave (remove)
   * - Nếu chưa save → save (add)
   */
  async toggleSavePost(dto: ToggleSavedPostDto): Promise<ToggleSavedPostResponseDto> {
    // 1. Validate user exists
    const user = await this.userRepo.findOne({
      where: { id: dto.userId },
      relations: ['savedPostList'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    // 2. Validate post exists
    const post = await this.postRepo.findOne({
      where: { id: dto.postId },
    });
    if (!post) {
      throw new NotFoundException(`Post with ID ${dto.postId} not found`);
    }

    // 3. Get or create SavedPostList for user
    let savedPostList = user.savedPostList;
    if (!savedPostList) {
      savedPostList = this.savedPostListRepo.create({ user });
      savedPostList = await this.savedPostListRepo.save(savedPostList);

      // Update user reference
      await this.userRepo.update(dto.userId, { savedPostList });
    }

    // 4. Check if already saved
    const existingItem = await this.savedPostItemRepo.findOne({
      where: {
        savedPostList: { id: savedPostList.id },
        post: { id: dto.postId },
      },
    });

    // 5. Toggle: Remove if exists, Add if not
    if (existingItem) {
      await this.savedPostItemRepo.remove(existingItem);
      return {
        message: 'Đã bỏ lưu bài viết',
        isSaved: false,
      };
    } else {
      const newItem = this.savedPostItemRepo.create({
        savedPostList,
        post,
      });
      await this.savedPostItemRepo.save(newItem);
      return {
        message: 'Đã lưu bài viết',
        isSaved: true,
      };
    }
  }

  /**
   * ✅ Check if a single post is saved by user
   */
  async checkIfSaved(userId: number, postId: number): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedPostList'],
    });

    if (!user || !user.savedPostList) {
      return false;
    }

    const existingItem = await this.savedPostItemRepo.findOne({
      where: {
        savedPostList: { id: user.savedPostList.id },
        post: { id: postId },
      },
    });

    return !!existingItem;
  }

  /**
   * ✅ Batch check: Check multiple posts at once (for newsfeed)
   */
  async batchCheckSaved(userId: number, postIds: number[]): Promise<BatchCheckSavedResponseDto> {
    if (postIds.length === 0) {
      return { savedMap: {} };
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedPostList'],
    });

    if (!user || !user.savedPostList) {
      // Return all false
      const savedMap: Record<number, boolean> = {};
      postIds.forEach((id) => (savedMap[id] = false));
      return { savedMap };
    }

    // Query all saved items for these posts in one query
    const savedItems = await this.savedPostItemRepo.find({
      where: {
        savedPostList: { id: user.savedPostList.id },
        post: { id: In(postIds) },
      },
      relations: ['post'],
    });

    // Build map
    const savedPostIds = new Set(savedItems.map((item) => item.post.id));
    const savedMap: Record<number, boolean> = {};
    postIds.forEach((id) => {
      savedMap[id] = savedPostIds.has(id);
    });

    return { savedMap };
  }

  /**
   * 📋 Get all saved posts for a user (paginated)
   */
  async getSavedPostsByUser(
    userId: number,
    page = 1,
    limit = 20,
  ): Promise<SavedPostListResponseDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedPostList'],
    });

    if (!user || !user.savedPostList) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    const [items, total] = await this.savedPostItemRepo.findAndCount({
      where: { savedPostList: { id: user.savedPostList.id } },
      relations: ['post', 'post.author'],
      order: { savedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const reactsMap = await this.userReactsService.getUserReactForPosts(
      items.map((i) => i.post.id),
      userId,
    );
    const votesMap = await this.userVotesService.getPostsVotes(
      items.map((i) => i.post.id),
      userId,
    );

    // Map items to PostResponseDto with reacts and votes
    const postDtos = items.map((item) => {
      const postDto = plainToInstance(PostResponseDto, item.post, {
        excludeExtraneousValues: true,
      });
      postDto['reacts'] = reactsMap.get(item.post.id);
      postDto['votes'] = votesMap.get(item.post.id);
      return postDto;
    });

    return {
      items: postDtos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 🗑️ Remove saved post by item ID
   */
  async removeSavedPost(userId: number, itemId: number): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedPostList'],
    });

    if (!user || !user.savedPostList) {
      throw new NotFoundException('Saved post list not found');
    }

    const item = await this.savedPostItemRepo.findOne({
      where: {
        id: itemId,
        savedPostList: { id: user.savedPostList.id },
      },
    });

    if (!item) {
      throw new NotFoundException('Saved post item not found');
    }

    await this.savedPostItemRepo.remove(item);
  }

  /**
   * 📊 Get total count of saved posts
   */
  async getSavedPostsCount(userId: number): Promise<number> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedPostList'],
    });

    if (!user || !user.savedPostList) {
      return 0;
    }

    return this.savedPostItemRepo.count({
      where: { savedPostList: { id: user.savedPostList.id } },
    });
  }
}
