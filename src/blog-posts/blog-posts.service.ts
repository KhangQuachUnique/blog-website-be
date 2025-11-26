import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

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
      .where('post.type = :type', { type: 'repost' })
      .getMany();
  }

  findOne(id: number) {
    return this.blogPostRepository.findOneBy({ id });
  }

  update(id: number, updateBlogPostDto: UpdateBlogPostDto) {
    return `This action updates a #${id} blogPost`;
  }

  async updateStatus(id: number, updateBlogStatusDto: UpdateBlogStatusDto) {
    const post = await this.blogPostRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`Can't find blog post with ID: ${id}`);
    }

    post.status = updateBlogStatusDto.status;

    return await this.blogPostRepository.save(post);
  }

  remove(id: number) {
    return `This action removes a #${id} blogPost`;
  }
}
