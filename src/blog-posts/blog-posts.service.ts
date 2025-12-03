import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { BlogPost } from './entities/blog-post.entity';
import { CommunityBlogPost } from './entities/community-blog-post.entity';
import { RepostBlogPost } from './entities/repost-blog-post.entity';
import { PersonalBlogPost } from './entities/personal-blog-post.entity';
import { User } from 'src/users/entities/user.entity';
import { Community } from 'src/communities/entities/community.entity';
import { Block } from 'src/blocks/entities/block.entity';
import { EBlogPostStatus } from './enums/blog-post-status.enum';
import {
  DetailCommunityPostResponseDto,
  DetailPersonalPostResponseDto,
  PostResponseDto,
} from './dto/response/blog-post-response.dto';
import { plainToInstance } from 'class-transformer';
import { BlogPostType } from './enums/blog-post-type.enum';

@Injectable()
export class BlogPostsService {
  constructor(
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
   * Tạo bài viết cá nhân
   * @param createBlogPostDto
   * @returns
   */
  async createPersonalPost(dto: CreateBlogPostDto): Promise<DetailPersonalPostResponseDto> {
    const blocks = this.blockRepository.create(
      dto.blocks?.map((blockDto) => ({
        ...blockDto,
      })) || [],
    );

    // Check author
    const author = await this.userRepository.findOne({ where: { id: dto.authorId } });
    if (!author) {
      throw new NotFoundException(`Can't find author with ID: ${dto.authorId}`);
    }

    const post: BlogPost = this.personalBlogPostRepository.create({
      title: dto.title,
      thumbnailUrl: dto.thumbnailUrl,
      isPublic: dto.isPublic,
      author: author,
      blocks: blocks,
    });
    const createdPost = await this.personalBlogPostRepository.save(post);

    const response = plainToInstance(DetailPersonalPostResponseDto, createdPost, {
      excludeExtraneousValues: true,
    });

    response.type = BlogPostType.PERSONAL;

    return response;
  }

  /**
   * Tạo bài viết cộng đồng
   * @param dto
   * @returns
   */
  async createCommunityPost(dto: CreateBlogPostDto): Promise<DetailCommunityPostResponseDto> {
    const blocks = this.blockRepository.create(
      dto.blocks?.map((blockDto) => ({
        ...blockDto,
      })) || [],
    );

    // Check author
    const author = await this.userRepository.findOne({ where: { id: dto.authorId } });
    if (!author) {
      throw new NotFoundException(`Can't find author with ID: ${dto.authorId}`);
    }

    // Check community
    const community = await this.communityRepository.findOne({ where: { id: dto.communityId } });
    if (!community) {
      throw new NotFoundException(`Can't find community with ID: ${dto.communityId}`);
    }

    const post: BlogPost = this.communityBlogPostRepository.create({
      title: dto.title,
      thumbnailUrl: dto.thumbnailUrl,
      isPublic: dto.isPublic,
      author: author,
      community: community,
      blocks: blocks,
    });
    const createdPost = await this.communityBlogPostRepository.save(post);

    const response = plainToInstance(DetailCommunityPostResponseDto, createdPost, {
      excludeExtraneousValues: true,
    });
    response.type = BlogPostType.COMMUNITY;

    return response;
  }

  /**
   * Tao bài viết đăng lại một bài viết cá nhân
   * @param dto
   * @returns
   */
  async createRepostBlogPost(dto: CreateBlogPostDto): Promise<PostResponseDto> {
    // Check original post
    const originalPost = await this.blogPostRepository.findOneBy({ id: dto.originalPostId });
    if (!originalPost) {
      throw new NotFoundException(`Can't find original post with ID: ${dto.originalPostId}`);
    }

    // Check author
    const author = await this.userRepository.findOne({ where: { id: dto.authorId } });
    if (!author) {
      throw new NotFoundException(`Can't find author with ID: ${dto.authorId}`);
    }

    const post: BlogPost = this.repostBlogPostRepository.create({
      title: dto.title,
      thumbnailUrl: dto.thumbnailUrl,
      isPublic: dto.isPublic,
      author: author,
      originalPost: originalPost,
    });
    const createdPost = await this.repostBlogPostRepository.save(post);

    const response = plainToInstance(PostResponseDto, createdPost, {
      excludeExtraneousValues: true,
    });
    response.type = BlogPostType.REPOST;

    return response;
  }

  findAll() {
    return 'This action returns all blog posts';
  }

  findOne(id: number) {
    return this.blogPostRepository.findOneBy({ id });
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

  /**
   * Xóa bài viết theo ID
   * @param id
   * @returns
   */
  async remove(id: number) {
    return await this.blogPostRepository.delete(id);
  }
}
