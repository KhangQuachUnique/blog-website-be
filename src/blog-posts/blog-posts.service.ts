import { In, Repository } from 'typeorm';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EBlogPostStatus } from './enums/blog-post-status.enum';

import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { BlogPost } from './entities/blog-post.entity';
import { CommunityBlogPost } from './entities/community-blog-post.entity';
import { RepostBlogPost } from './entities/repost-blog-post.entity';
import { PersonalBlogPost } from './entities/personal-blog-post.entity';
import { User } from 'src/users/entities/user.entity';
import { Community } from 'src/communities/entities/community.entity';
import { Block } from 'src/blocks/entities/block.entity';
import {
  DetailCommunityPostResponseDto,
  DetailPersonalPostResponseDto,
  PostResponseDto,
} from './dto/response/blog-post-response.dto';
import { plainToInstance } from 'class-transformer';
import { BlogPostType } from './enums/blog-post-type.enum';
import { HashtagsService } from 'src/hashtags/hashtags.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserReactQueryService } from 'src/user-reacts/services/user-react-query.service';
import { UserVotesService } from 'src/user-votes/user-votes.service';

import { CommunityMember } from 'src/communities/entities/community-member.entity';
import { ECommunityRole } from 'src/communities/enums/community-role.enum';
import { ViewedHistory } from 'src/viewed-history/entities/viewed-history.entity';

@Injectable()
export class BlogPostsService {
  constructor(
    private readonly hashtagService: HashtagsService,

    private readonly notificationService: NotificationsService,

    private readonly userVotesService: UserVotesService,

    private readonly userReactQueryService: UserReactQueryService,

    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Community)
    private communityRepository: Repository<Community>,

    // constructor inject thêm:
    @InjectRepository(CommunityMember)
    private memberRepository: Repository<CommunityMember>,

    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,

    @InjectRepository(CommunityBlogPost)
    private communityBlogPostRepository: Repository<CommunityBlogPost>,

    @InjectRepository(PersonalBlogPost)
    private personalBlogPostRepository: Repository<PersonalBlogPost>,

    @InjectRepository(RepostBlogPost)
    private repostBlogPostRepository: Repository<RepostBlogPost>,

    @InjectRepository(ViewedHistory)
    private readonly viewedHistoryRepository: Repository<ViewedHistory>,
  ) {}
  /**
   * === Nhóm: Tạo bài viết (Creation methods) ===
   * - `create(dto: CreateBlogPostDto)` : Tạo bài viết theo loại Personal / Community / Repost (Create post by type)
   * - `createRepostBlogPost(dto: CreateBlogPostDto)` : Tạo repost từ một PersonalBlogPost (Create repost)
   */
  async create(dto: CreateBlogPostDto): Promise<PostResponseDto> {
    // Validate author
    const author = await this.userRepository.findOne({ where: { id: dto.authorId } });
    if (!author) {
      throw new NotFoundException(`Không tìm thấy tác giả với ID: ${dto.authorId}`);
    }

    // Get or create hashtags
    const hashtags = await this.hashtagService.getOrCreate(dto.hashtags || []);

    switch (dto.type) {
      case BlogPostType.PERSONAL: {
        const blocks = this.blockRepository.create(dto.blocks || []);

        const post = this.personalBlogPostRepository.create({
          title: dto.title,
          shortDescription: dto.shortDescription,
          thumbnailUrl: dto.thumbnailUrl,
          isPublic: dto.isPublic,
          author,
          blocks,
          hashtags,
        });

        const savedPost = await this.personalBlogPostRepository.save(post);
        const response = plainToInstance(DetailPersonalPostResponseDto, savedPost, {
          excludeExtraneousValues: true,
        });
        response.type = BlogPostType.PERSONAL;
        return response;
      }

      case BlogPostType.COMMUNITY: {
        const community = await this.communityRepository.findOne({
          where: { id: dto.communityId },
        });
        if (!community) {
          throw new NotFoundException(`Không tìm thấy cộng đồng với ID: ${dto.communityId}`);
        }

        const me = await this.memberRepository.findOne({
          where: { community: { id: community.id }, user: { id: dto.authorId } },
        });

        if (!me) {
          throw new ForbiddenException('Bạn cần tham gia cộng đồng để tạo bài viết.');
        }

        if (me.role === ECommunityRole.PENDING) {
          throw new ForbiddenException(
            'Yêu cầu tham gia đang chờ duyệt. Bạn chưa thể tạo bài viết.',
          );
        }

        const isPrivileged =
          me.role === ECommunityRole.ADMIN || me.role === ECommunityRole.MODERATOR;

        const isApproved = community.requirePostApproval && !isPrivileged ? false : true;

        const blocks = this.blockRepository.create(dto.blocks || []);

        const post = this.communityBlogPostRepository.create({
          title: dto.title,
          shortDescription: dto.shortDescription,
          thumbnailUrl: dto.thumbnailUrl,
          isPublic: dto.isPublic,
          author,
          community,
          blocks,
          hashtags,
          isApproved,
        });

        const savedPost = await this.communityBlogPostRepository.save(post);

        const response = plainToInstance(DetailCommunityPostResponseDto, savedPost, {
          excludeExtraneousValues: true,
        });
        response.type = BlogPostType.COMMUNITY;
        return response;
      }

      case BlogPostType.REPOST: {
        const originalPost = await this.personalBlogPostRepository.findOne({
          where: { id: dto.originalPostId },
        });
        if (!originalPost) {
          throw new NotFoundException(
            `Không tìm thấy bài viết cá nhân với ID: ${dto.originalPostId}. Chỉ cho phép đăng lại bài viết cá nhân.`,
          );
        }

        const post = this.repostBlogPostRepository.create({
          title: dto.title,
          shortDescription: dto.shortDescription,
          thumbnailUrl: dto.thumbnailUrl || originalPost.thumbnailUrl,
          isPublic: dto.isPublic,
          author,
          originalPost,
          hashtags,
        });

        const savedPost = await this.repostBlogPostRepository.save(post);
        const response = plainToInstance(PostResponseDto, savedPost, {
          excludeExtraneousValues: true,
        });
        response.type = BlogPostType.REPOST;
        return response;
      }

      default:
        throw new NotFoundException(`Loại bài viết không hợp lệ`);
    }
  }

  /**
   * Tao bài viết đăng lại một bài viết cá nhân (chỉ cho phép repost PersonalBlogPost)
   */
  async createRepostBlogPost(dto: CreateBlogPostDto): Promise<PostResponseDto> {
    const originalPost = await this.personalBlogPostRepository.findOneBy({
      id: dto.originalPostId,
    });
    if (!originalPost) {
      throw new NotFoundException(
        `Không tìm thấy bài viết cá nhân với ID: ${dto.originalPostId}. Chỉ cho phép đăng lại bài viết cá nhân.`,
      );
    }

    const author = await this.userRepository.findOne({ where: { id: dto.authorId } });
    if (!author) {
      throw new NotFoundException(`Không tìm thấy tác giả với ID: ${dto.authorId}`);
    }

    const hashtags = await this.hashtagService.getOrCreate(dto.hashtags || []);

    const post = this.repostBlogPostRepository.create({
      title: dto.title,
      shortDescription: dto.shortDescription,
      thumbnailUrl: dto.thumbnailUrl,
      isPublic: dto.isPublic,
      author,
      originalPost,
      hashtags,
    });
    const createdPost = await this.repostBlogPostRepository.save(post);

    const response = plainToInstance(PostResponseDto, createdPost, {
      excludeExtraneousValues: true,
    });
    response.type = BlogPostType.REPOST;

    return response;
  }

  /**
   * === Nhóm: Repost — các helper liên quan (Repost helpers) ===
   * - `checkReposted(userId, originalPostId)` : Kiểm tra user đã repost chưa (Check if repost exists)
   * - `removeRepost(userId, originalPostId)` : Xóa một repost (Remove repost)
   */
  async checkReposted(userId: number, originalPostId: number): Promise<boolean> {
    const repost = await this.repostBlogPostRepository.findOne({
      where: { author: { id: userId }, originalPost: { id: originalPostId } },
    });
    return !!repost;
  }

  async removeRepost(userId: number, originalPostId: number) {
    const repost = await this.repostBlogPostRepository.findOne({
      where: { author: { id: userId }, originalPost: { id: originalPostId } },
    });

    if (!repost) {
      throw new NotFoundException('Không tìm thấy bài đăng lại');
    }

    return this.repostBlogPostRepository.remove(repost);
  }

  // Helper: kiểm tra xem user có quyền quản lý bài viết (tác giả hoặc admin/mod của cộng đồng)
  private async userCanManagePost(post: BlogPost, userId: number): Promise<boolean> {
    if (!userId) return false;
    if (post.author && post.author.id === userId) return true;
    if (post instanceof CommunityBlogPost && post.community) {
      const member = await this.memberRepository.findOne({
        where: { community: { id: post.community.id }, user: { id: userId } },
      });
      if (
        member &&
        (member.role === ECommunityRole.ADMIN || member.role === ECommunityRole.MODERATOR)
      )
        return true;
    }
    return false;
  }

  /**
   * === Nhóm: Đọc bài viết / Hiển thị (Read methods) ===
   * - `findAll()` : Lấy tất cả bài viết (Get all posts)
   * - `findAllPostsByUser(userId)` : Lấy tất cả bài viết của một user (Get posts by user)
   * - `findOne(id, userId?)` : Lấy chi tiết một bài viết (Get single post detail)
   */
  async findAll() {
    const posts = await this.blogPostRepository.find({
      relations: ['author', 'community', 'blocks', 'hashtags'],
      order: { createdAt: 'DESC' },
    });

    const reactsMap = await this.userReactQueryService.getUserReactForPosts(posts.map((p) => p.id));

    for (const post of posts) post['reacts'] = reactsMap.get(post.id);

    return posts.map((post) =>
      plainToInstance(PostResponseDto, post, { excludeExtraneousValues: true }),
    );
  }

  async findAllPostsByUser(userId: number): Promise<PostResponseDto[]> {
    const posts = await this.blogPostRepository.find({
      where: { author: { id: userId } },
      relations: ['author', 'community', 'hashtags', 'originalPost'],
    });

    if (!posts.length) return [];

    const reactsMap = await this.userReactQueryService.getUserReactForPosts(posts.map((p) => p.id));
    const votesMap = await this.userVotesService.getPostsVotes(
      posts.map((p) => p.id),
      userId,
    );

    for (const post of posts) post['reacts'] = reactsMap.get(post.id);

    return posts.map((post) => {
      const response = plainToInstance(PostResponseDto, post, { excludeExtraneousValues: true });
      response.votes = votesMap.get(post.id) || { upvotes: 0, downvotes: 0, userVote: null };
      return response;
    });
  }

  async findOne(
    id: number,
    userId?: number,
  ): Promise<DetailPersonalPostResponseDto | DetailCommunityPostResponseDto> {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['author', 'community', 'blocks', 'hashtags'],
    });

    if (!post) throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);

    const reacts = await this.userReactQueryService.getUserReactForPost(id, userId);
    post['reacts'] = reacts;

    if (post instanceof PersonalBlogPost)
      return plainToInstance(DetailPersonalPostResponseDto, post, {
        excludeExtraneousValues: true,
      });
    if (post instanceof CommunityBlogPost)
      return plainToInstance(DetailCommunityPostResponseDto, post, {
        excludeExtraneousValues: true,
      });

    throw new NotFoundException(`Bài viết với ID: ${id} không thuộc loại cá nhân hoặc cộng đồng.`);
  }

  /**
   * === Nhóm: Cộng đồng — Đọc / Quản lý (Community read / management) ===
   * - `findByCommunity(communityId)` : Lấy bài viết public của cộng đồng (Get community posts)
   * - `findByCommunityManage(communityId, status?, userId)` : Quản lý bài viết (Admin/Mod) (Manage community posts)
   */
  async findByCommunity(communityId: number) {
    const posts = await this.communityBlogPostRepository.find({
      where: { community: { id: communityId }, status: EBlogPostStatus.ACTIVE },
      relations: ['author', 'community', 'hashtags'],
      order: { createdAt: 'DESC' },
    });

    const reactsMap = await this.userReactQueryService.getUserReactForPosts(posts.map((p) => p.id));
    for (const post of posts) post['reacts'] = reactsMap.get(post.id);

    return posts.map((post) =>
      plainToInstance(PostResponseDto, post, { excludeExtraneousValues: true }),
    );
  }

  async findByCommunityManage(
    communityId: number,
    status: EBlogPostStatus | undefined,
    userId: number,
  ) {
    const me = await this.memberRepository.findOne({
      where: { community: { id: communityId }, user: { id: userId } },
    });

    const ok = me && (me.role === ECommunityRole.ADMIN || me.role === ECommunityRole.MODERATOR);
    if (!ok) throw new ForbiddenException('Bạn không có quyền quản lý bài viết cộng đồng này.');

    const where: any = { community: { id: communityId } };
    if (status) where.status = status;
    else where.status = In([EBlogPostStatus.ACTIVE]);

    const posts = await this.communityBlogPostRepository.find({
      where,
      relations: ['author', 'community', 'hashtags'],
      order: { createdAt: 'DESC' },
    });

    const reactsMap = await this.userReactQueryService.getUserReactForPosts(posts.map((p) => p.id));
    for (const post of posts) post['reacts'] = reactsMap.get(post.id);

    return posts.map((post) =>
      plainToInstance(PostResponseDto, post, { excludeExtraneousValues: true }),
    );
  }

  /**
   * === Nhóm: Cập nhật / Trạng thái / Quyền riêng tư (Update / Status / Privacy) ===
   * - `update(id, dto)` : Cập nhật nội dung / blocks (Update post)
   * - `updateStatus(id, {status})` : Thay đổi trạng thái chung (Change status)
   * - `publish(id)` : Đăng bài (Publish)
   * - `hide(id)` : Ẩn bài (Hide)
   * - `restore(id)` : Khôi phục từ HIDDEN -> ACTIVE (Restore)
   * - `togglePrivacy(id)` : Đổi public/private (Toggle privacy)
   */
  async update(id: number, dto: UpdateBlogPostDto, userId: number): Promise<PostResponseDto> {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['blocks', 'author', 'community'],
    });
    if (!post) throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);

    const ok = await this.userCanManagePost(post, userId);
    if (!ok) throw new ForbiddenException('Bạn không có quyền chỉnh sửa bài viết này.');

    if (dto.title !== undefined) post.title = dto.title;
    if (dto.shortDescription !== undefined) post.shortDescription = dto.shortDescription;
    if (dto.thumbnailUrl !== undefined) post.thumbnailUrl = dto.thumbnailUrl;
    if (dto.isPublic !== undefined) post.isPublic = dto.isPublic;

    if (dto.blocks !== undefined) {
      await this.blockRepository.delete({ post: { id } });
      const newBlocks = this.blockRepository.create(
        dto.blocks.map((blockDto) => ({ ...blockDto, post: { id: post.id } })),
      );
      post.blocks = await this.blockRepository.save(newBlocks);
    }

    const saved = await this.blogPostRepository.save(post);
    return plainToInstance(PostResponseDto, saved, { excludeExtraneousValues: true });
  }

  async updateStatus(id: number, dto: { status: EBlogPostStatus }, userId: number) {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['author', 'community'],
    });
    if (!post) throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    const ok = await this.userCanManagePost(post, userId);
    if (!ok) throw new ForbiddenException('Bạn không có quyền thay đổi trạng thái bài viết này.');
    post.status = dto.status;
    const saved = await this.blogPostRepository.save(post);
    return plainToInstance(PostResponseDto, saved, { excludeExtraneousValues: true });
  }

  async publish(id: number, userId: number) {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['author', 'community'],
    });

    if (!post) throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);

    const ok = await this.userCanManagePost(post, userId);

    if (!ok) throw new ForbiddenException('Bạn không có quyền đăng bài viết này.');

    post.status = EBlogPostStatus.ACTIVE;
    const saved = await this.blogPostRepository.save(post);
    return {
      message: 'Đã đăng bài viết thành công.',
      data: plainToInstance(PostResponseDto, saved, { excludeExtraneousValues: true }),
    };
  }

  async hide(id: number, userId: number) {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['author', 'community'],
    });
    if (!post) throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    const ok = await this.userCanManagePost(post, userId);
    if (!ok) throw new ForbiddenException('Bạn không có quyền ẩn bài viết này.');
    if (post.status != EBlogPostStatus.ACTIVE) {
      return { message: `Không thể ẩn. Trạng thái hiện tại là '${post.status}', cần là 'ACTIVE'.` };
    }
    post.status = EBlogPostStatus.HIDDEN;
    const saved = await this.blogPostRepository.save(post);
    return {
      message: 'Đã chuyển trạng thái bài viết sang HIDDEN.',
      data: plainToInstance(PostResponseDto, saved, { excludeExtraneousValues: true }),
    };
  }

  async restore(id: number, userId: number) {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['author', 'community'],
    });
    if (!post) throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    const ok = await this.userCanManagePost(post, userId);
    if (!ok) throw new ForbiddenException('Bạn không có quyền khôi phục bài viết này.');
    if (post.status != EBlogPostStatus.HIDDEN) {
      return {
        message: `Không thể khôi phục. Trạng thái hiện tại là '${post.status}', cần là 'HIDDEN'.`,
      };
    }
    post.status = EBlogPostStatus.ACTIVE;
    const saved = await this.blogPostRepository.save(post);
    return {
      message: 'Đã khôi phục trạng thái bài viết về ACTIVE.',
      data: plainToInstance(PostResponseDto, saved, { excludeExtraneousValues: true }),
    };
  }

  async togglePrivacy(id: number, userId: number) {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['author', 'community'],
    });
    if (!post) throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);
    const ok = await this.userCanManagePost(post, userId);
    if (!ok)
      throw new ForbiddenException('Bạn không có quyền thay đổi chế độ riêng tư của bài viết này.');
    post.isPublic = !post.isPublic;
    const saved = await this.blogPostRepository.save(post);
    return {
      message: `Đã đổi chế độ riêng tư của bài viết thành ${post.isPublic ? 'công khai' : 'riêng tư'}.`,
      data: plainToInstance(PostResponseDto, saved, { excludeExtraneousValues: true }),
    };
  }

  /**
   * === Nhóm: Xoá (Delete) ===
   * - `remove(id)` : Xóa bài viết (Delete post) — xoá cả viewed history trước
   */
  async remove(id: number, userId: number) {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['author', 'community'],
    });
    if (!post) throw new NotFoundException(`Không tìm thấy bài viết với ID: ${id}`);

    const ok = await this.userCanManagePost(post, userId);
    if (!ok) throw new ForbiddenException('Bạn không có quyền xóa bài viết này.');

    // ✅ Xoá viewed history trước để tránh lỗi FK (viewed_history.postId)
    await this.viewedHistoryRepository.delete({ post: { id } });
    return await this.blogPostRepository.delete(id);
  }
}
