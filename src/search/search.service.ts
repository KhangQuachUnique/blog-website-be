import { Injectable } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import { PostResponseDto } from 'src/blog-posts/dto/response/blog-post-response.dto';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Raw, Repository, Brackets } from 'typeorm';
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
   * Search all types (Used by Search Sidebar)
   */
  async search(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;

    const posts = await this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.hashtags', 'hashtag')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .leftJoin('post.blocks', 'block') // QUAN TRỌNG: Đảm bảo BlogPost entity có relation 'blocks'
      .where(new Brackets((qb) => {
         qb.where('LOWER(post.title) ILIKE :keyword', { keyword })
           .orWhere('LOWER(hashtag.name) ILIKE :keyword', { keyword })
           // [SỬA ĐỔI]: Bỏ check block.type, chỉ check content để đảm bảo tìm thấy mọi thứ
           .orWhere('LOWER(block.content) ILIKE :keyword', { keyword }); 
      }))
      // .andWhere('post.isPublic = :isPublic', { isPublic: true })
      .orderBy('post.createdAt', 'DESC')
      .take(10)
      .getMany();

    // ... (Code Users và Communities giữ nguyên)
    const users = await this.userRepository.find({
      where: [
        { username: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) },
      ],
      take: 5
    });

    const communities = await this.communityRepository.find({
      where: [
        { name: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) },
      ],
      take: 5
    });

    return {
      posts: posts.map((post) => plainToInstance(PostResponseDto, post)),
      users,
      communities,
    };
  }

  /**
   * Search blog posts only
   */
  async searchByPost(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`; 

    const posts = await this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.hashtags', 'hashtag')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .leftJoin('post.blocks', 'block')
      .where(new Brackets((qb) => {
         qb.where('LOWER(post.title) ILIKE :keyword', { keyword })
           .orWhere('LOWER(hashtag.name) ILIKE :keyword', { keyword })
           .orWhere('LOWER(block.content) ILIKE :keyword', { keyword });
      }))
      .orderBy('post.createdAt', 'DESC')
      .getMany();

    return { posts: posts.map((post) => plainToInstance(PostResponseDto, post)) };
  }
  
  // ... (Các hàm còn lại giữ nguyên)
  async searchByUser(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const users = await this.userRepository.find({
      where: [{ username: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) }],
    });
    return { users };
  }

  async searchByCommunity(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const communities = await this.communityRepository.find({
      where: [{ name: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) }],
    });
    return { communities };
  }

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