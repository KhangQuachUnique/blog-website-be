import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { BlogPost } from './entities/blog-post.entity';
import { CommunityBlogPost } from './entities/community-blog-post.entity';
import { RepostBlogPost } from './entities/repost-blog-post.entity';
import { PersonalBlogPost } from './entities/personal-blog-post.entity';
import { Block } from 'src/blocks/entities/block.entity';
import { EBlogPostStatus } from './enums/blog-post-status.enum';

@Injectable()
export class BlogPostsService {
  constructor(
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,

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
  async create(dto: CreateBlogPostDto): Promise<BlogPost> {
    const post: BlogPost = this.personalBlogPostRepository.create({
      title: dto.title,
      thumbnailUrl: dto.thumbnailUrl,
      isPublic: dto.isPublic,
      author: { id: dto.authorId },
      blocks: dto.blocks,
    });
    return await this.personalBlogPostRepository.save(post);
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
