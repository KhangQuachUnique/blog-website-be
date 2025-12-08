import { Injectable } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import { PostResponseDto } from 'src/blog-posts/dto/response/blog-post-response.dto';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Raw, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';
import { Community } from 'src/communities/entities/community.entity';
import { SearchResponseDto } from './dto/response/search-response.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly blogPostRepository: Repository<BlogPost>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
  ) {}

  /**
   * Search all types
   * @param searchDto
   */
  async search(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`; // Chuẩn bị chuỗi tìm kiếm tương đối (ILIKE)

    // Search posts by title and hashtag
    const posts = await this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.hashtags', 'hashtag')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .where('LOWER(post.title) ILIKE :keyword', { keyword })
      .orWhere('LOWER(hashtag.name) ILIKE :keyword', { keyword })
      .getMany();

    const users = await this.userRepository.find({
      where: [
        {
          username: Raw((alias) => `LOWER(${alias}) ILIKE '%${keyword.toLowerCase()}%'`),
        },
      ],
    });

    const communities = await this.communityRepository.find({
      where: [
        {
          name: Raw((alias) => `LOWER(${alias}) ILIKE '%${keyword.toLowerCase()}%'`),
        },
      ],
    });

    return {
      posts: posts.map((post) => plainToInstance(PostResponseDto, post)),
      users,
      communities,
    };
  }

  /**
   * Search blog posts by title
   * @param searchDto
   * @returns
   */
  async searchByPost(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`; // Chuẩn bị chuỗi tìm kiếm tương đối (ILIKE)
    const posts = await this.blogPostRepository.find({
      where: [
        {
          title: Raw((alias) => `LOWER(${alias}) ILIKE '%${keyword.toLowerCase()}%'`),
        },
      ],
      relations: ['author', 'community', 'hashtags'],
    });
    return { posts: posts.map((post) => plainToInstance(PostResponseDto, post)) };
  }

  /**
   * Search users by username
   * @param searchDto
   * @returns
   */
  async searchByUser(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`; // Chuẩn bị chuỗi tìm kiếm tương đối (ILIKE)
    const users = await this.userRepository.find({
      where: [
        {
          username: Raw((alias) => `LOWER(${alias}) ILIKE '%${keyword.toLowerCase()}%'`),
        },
      ],
    });
    return { users };
  }

  /**
   * Search communities by name
   * @param searchDto
   * @returns
   */
  async searchByCommunity(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`; // Chuẩn bị chuỗi tìm kiếm tương đối (ILIKE)
    const communities = await this.communityRepository.find({
      where: [
        {
          name: Raw((alias) => `LOWER(${alias}) ILIKE '%${keyword.toLowerCase()}%'`),
        },
      ],
    });
    return { communities };
  }

  /**
   * Search blog posts by hashtag name
   * @param searchDto
   * @returns
   */
  async searchByHashtag(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;

    const posts = await this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.hashtags', 'hashtag')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .where('LOWER(hashtag.name) ILIKE :keyword', { keyword })
      .getMany();

    return { posts: posts.map((post) => plainToInstance(PostResponseDto, post)) };
  }
}
