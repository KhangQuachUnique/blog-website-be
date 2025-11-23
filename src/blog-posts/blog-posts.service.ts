import { Injectable } from '@nestjs/common';
import { CreateBlogPostDto } from './dto/create-blog-post.dto';
import { UpdateBlogPostDto } from './dto/update-blog-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from './entities/blog-post.entity';

@Injectable()
export class BlogPostsService {
  constructor(
    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,
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

  remove(id: number) {
    return `This action removes a #${id} blogPost`;
  }
}
