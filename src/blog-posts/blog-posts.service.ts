import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { EBlogPostStatus } from './enums/blog-post-status.enum';

import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { UpdateBlogStatusDto } from './dto/update-blog-post-status.dto';
import { BlogPost } from './entities/blog-post.entity';
import { CommunityBlogPost } from './entities/community-blog-post.entity';
import { RepostBlogPost } from './entities/repost-blog-post.entity';
import { PersonalBlogPost } from './entities/personal-blog-post.entity';

@Injectable()
export class BlogPostsService {
  constructor(
    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,

    @InjectRepository(CommunityBlogPost)
    private communityBlogPostRepository: Repository<CommunityBlogPost>,

    @InjectRepository(PersonalBlogPost)
    private personalBlogPostRepository: Repository<PersonalBlogPost>,

    @InjectRepository(RepostBlogPost)
    private repostBlogPostRepository: Repository<RepostBlogPost>,
  ) {}

  create(createBlogPostDto: CreateBlogPostDto) {
    return 'This action adds a new blogPost';
  }

  findAll() {
    return this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.blocks', 'block')
      .getMany();
  }

  async findOne(id: number) {
    const post = await this.blogPostRepository.findOneBy({ id });
    if (!post) {
      throw new NotFoundException(`Can't find blog post with ID: ${id}`);
    }
    return post;
  }

  update(id: number, updateBlogPostDto: UpdateBlogPostDto) {
    return `This action updates a #${id} blogPost`;
  }

  remove(id: number) {
    return `This action removes a #${id} blogPost`;
  }

  async updateStatus(id: number, updateBlogStatusDto: UpdateBlogStatusDto) {
    const post = await this.findOne(id);

    post.status = updateBlogStatusDto.status;
    return await this.blogPostRepository.save(post);
  }

  async restore(id: number) {
    const post = await this.findOne(id);

    if (post.status != EBlogPostStatus.HIDDEN) {
      return { message: `Cannot restore. Current status is '${post.status}', expecting 'HIDDEN'.` };
    }

    post.status = EBlogPostStatus.ACTIVE;

    await this.blogPostRepository.save(post);

    return {
      message: 'Successfully restored blog post status to ACTIVE.',
      data: post
    };
  }

  async hide(id: number) {
    const post = await this.findOne(id);

    if (post.status != EBlogPostStatus.ACTIVE) {
      return { message: `Cannot hide. Current status is '${post.status}', expecting 'ACTIVE'.` };
    }

    post.status = EBlogPostStatus.HIDDEN;

    await this.blogPostRepository.save(post);

    return {
      message: 'Successfully changed blog post status to HIDDEN.',
      data: post
    };
  }

  async publish(id: number) {
    const post = await this.findOne(id);

    if (post.status != EBlogPostStatus.DRAFT) {
      return { message: `Cannot publish. Current status is '${post.status}', expecting 'DRAFT'.` };
    }

    post.status = EBlogPostStatus.ACTIVE;

    await this.blogPostRepository.save(post);

    return {
      message: 'Successfully published blog post.',
      data: post
    };
  }
}
