import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class BlogPostsService {
  constructor(
    private readonly hashtagService: HashtagsService,

    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Community)
    private communityRepository: Repository<Community>,

    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,

    @InjectRepository(CommunityBlogPost)
    private communityBlogPostRepository: Repository<CommunityBlogPost>,

    @InjectRepository(PersonalBlogPost)
    private personalBlogPostRepository: Repository<PersonalBlogPost>,

    @InjectRepository(RepostBlogPost)
    private repostBlogPostRepository: Repository<RepostBlogPost>,
  ) {}

  /**
   * Tạo bài viết theo loại (Personal, Community, Repost)
   */
  async create(dto: CreateBlogPostDto): Promise<PostResponseDto> {
    // Validate author
    const author = await this.userRepository.findOne({ where: { id: dto.authorId } });
    if (!author) {
      throw new NotFoundException(`Can't find author with ID: ${dto.authorId}`);
    }

    // Get or create hashtags
    const hashtags = await this.hashtagService.getOrCreate(dto.hashtags || []);

    switch (dto.type) {
      // Create personal blog post
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

      // Create community blog post
      case BlogPostType.COMMUNITY: {
        // Validate community
        const community = await this.communityRepository.findOne({
          where: { id: dto.communityId },
        });
        if (!community) {
          throw new NotFoundException(`Can't find community with ID: ${dto.communityId}`);
        }

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
        });

        const savedPost = await this.communityBlogPostRepository.save(post);
        const response = plainToInstance(DetailCommunityPostResponseDto, savedPost, {
          excludeExtraneousValues: true,
        });
        response.type = BlogPostType.COMMUNITY;
        return response;
      }

      // Create repost blog post (chỉ repost PersonalBlogPost)
      case BlogPostType.REPOST: {
        // Validate original post - chỉ cho phép repost PersonalBlogPost
        const originalPost = await this.personalBlogPostRepository.findOne({
          where: { id: dto.originalPostId },
        });
        if (!originalPost) {
          throw new NotFoundException(
            `Can't find personal post with ID: ${dto.originalPostId}. Only personal posts can be reposted.`,
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
        throw new NotFoundException(`Invalid post type`);
    }
  }

  /**
   * Tao bài viết đăng lại một bài viết cá nhân (chỉ cho phép repost PersonalBlogPost)
   * @param dto
   * @returns
   */
  async createRepostBlogPost(dto: CreateBlogPostDto): Promise<PostResponseDto> {
    // Check original post - chỉ cho phép repost PersonalBlogPost
    const originalPost = await this.personalBlogPostRepository.findOneBy({
      id: dto.originalPostId,
    });
    if (!originalPost) {
      throw new NotFoundException(
        `Can't find personal post with ID: ${dto.originalPostId}. Only personal posts can be reposted.`,
      );
    }

    // Check author
    const author = await this.userRepository.findOne({ where: { id: dto.authorId } });
    if (!author) {
      throw new NotFoundException(`Can't find author with ID: ${dto.authorId}`);
    }

    // Check hashtags or create new ones
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

  async findAll() {
    const posts = await this.blogPostRepository.find({
      relations: ['author', 'community', 'blocks', 'hashtags'],
      order: {
        createdAt: 'DESC',
      },
    });

    return posts.map((post) => plainToInstance(PostResponseDto, post));
  }

  findOne(id: number) {
    return this.blogPostRepository.findOne({
      where: { id },
      relations: ['author', 'community', 'blocks', 'hashtags'],
    });
  }

  /**
   * Cập nhật bài viết theo ID
   * @param id
   * @param dto
   * @returns
   */
  async update(id: number, dto: UpdateBlogPostDto): Promise<BlogPost> {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['blocks'],
    });

    if (!post) {
      throw new NotFoundException(`Can't find blog post with ID: ${id}`);
    }

    // Cập nhật các trường cơ bản
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.shortDescription !== undefined) post.shortDescription = dto.shortDescription;
    if (dto.thumbnailUrl !== undefined) post.thumbnailUrl = dto.thumbnailUrl;
    if (dto.isPublic !== undefined) post.isPublic = dto.isPublic;

    // Cập nhật các trường là relation
    // Blocks
    if (dto.blocks !== undefined) {
      await this.blockRepository.delete({ post: { id } });
      const newBlocks = this.blockRepository.create(
        dto.blocks.map((blockDto) => ({
          ...blockDto,
          post: { id: post.id },
        })),
      );
      post.blocks = await this.blockRepository.save(newBlocks);
    }

    return this.blogPostRepository.save(post);
  }

  /**
   * Xóa bài viết theo ID
   * @param id
   * @returns
   */
  async remove(id: number) {
    return await this.blogPostRepository.delete(id);
  }

  /**
   * Cập nhật trạng thái bài viết
   * @param id
   * @param dto
   * @returns
   */
  async updateStatus(id: number, dto: { status: EBlogPostStatus }) {
    const post = await this.blogPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Can't find blog post with ID: ${id}`);
    }

    post.status = dto.status;
    return this.blogPostRepository.save(post);
  }

  async restore(id: number) {
    const post = await this.blogPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Can't find blog post with ID: ${id}`);
    }

    if (post.status != EBlogPostStatus.HIDDEN) {
      return { message: `Cannot restore. Current status is '${post.status}', expecting 'HIDDEN'.` };
    }

    post.status = EBlogPostStatus.ACTIVE;

    await this.blogPostRepository.save(post);

    return {
      message: 'Successfully restored blog post status to ACTIVE.',
      data: post,
    };
  }

  async hide(id: number) {
    const post = await this.blogPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Can't find blog post with ID: ${id}`);
    }

    if (post.status != EBlogPostStatus.ACTIVE) {
      return { message: `Cannot hide. Current status is '${post.status}', expecting 'ACTIVE'.` };
    }

    post.status = EBlogPostStatus.HIDDEN;

    await this.blogPostRepository.save(post);

    return {
      message: 'Successfully changed blog post status to HIDDEN.',
      data: post,
    };
  }

  async publish(id: number) {
    const post = await this.blogPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Can't find blog post with ID: ${id}`);
    }

    if (post.status != EBlogPostStatus.DRAFT) {
      return { message: `Cannot publish. Current status is '${post.status}', expecting 'DRAFT'.` };
    }

    post.status = EBlogPostStatus.ACTIVE;

    await this.blogPostRepository.save(post);

    return {
      message: 'Successfully published blog post.',
      data: post,
    };
  }
}
