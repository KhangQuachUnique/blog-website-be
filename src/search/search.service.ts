import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchDto, SearchType } from './dto/search.dto';

// Import Entities (Model) từ các module khác
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { User } from '../users/entities/user.entity';
import { Community } from '../communities/entities/community.entity';
import { Hashtag } from '../hashtags/entities/hashtag.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(BlogPost) private postRepo: Repository<BlogPost>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Community) private communityRepo: Repository<Community>,
    @InjectRepository(Hashtag) private hashtagRepo: Repository<Hashtag>,
  ) {}

  async search(searchDto: SearchDto) {
    const { q, type } = searchDto;
    const keyword = `%${q.toLowerCase()}%`; // Chuẩn bị chuỗi tìm kiếm tương đối (ILIKE)

    // Nếu type là ALL hoặc undefined, tìm tất cả loại
    if (type === SearchType.ALL || !type) {
      const [posts, users, communities, hashtags] = await Promise.all([
        this.searchPosts(keyword),
        this.searchUsers(keyword),
        this.searchCommunities(keyword),
        this.searchHashtags(keyword)
      ]);
      
      return {
        posts,
        users, 
        communities,
        hashtags,
        total: posts.length + users.length + communities.length + hashtags.length
      };
    }

    // Tìm kiếm theo loại cụ thể
    switch (type) {
      case SearchType.POST:
        return this.searchPosts(keyword);
      case SearchType.USER:
        return this.searchUsers(keyword);
      case SearchType.COMMUNITY:
        return this.searchCommunities(keyword);
      case SearchType.HASHTAG:
        return this.searchHashtags(keyword);
      default:
        return [];
    }
  }

  // Các method tìm kiếm riêng biệt
  private async searchPosts(keyword: string) {
    return this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select(['post.id', 'post.title', 'post.createdAt', 'author.username', 'author.avatarUrl'])
      .where('LOWER(post.title) LIKE :keyword', { keyword })
      .andWhere('post.isPublic = :isPublic', { isPublic: true })
      .orderBy('post.createdAt', 'DESC')
      .limit(10) // Giới hạn 10 kết quả cho global search
      .getMany();
  }

  private async searchUsers(keyword: string) {
    return this.userRepo.createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.avatarUrl', 'user.bio'])
      .where('LOWER(user.username) LIKE :keyword', { keyword })
      .limit(10)
      .getMany();
  }

  private async searchCommunities(keyword: string) {
    return this.communityRepo.createQueryBuilder('community')
      .where('LOWER(community.name) LIKE :keyword', { keyword })
      .andWhere('community.isPublic = :isPublic', { isPublic: true })
      .limit(10)
      .getMany();
  }

  private async searchHashtags(keyword: string) {
    return this.hashtagRepo.createQueryBuilder('hashtag')
      .where('LOWER(hashtag.name) LIKE :keyword', { keyword })
      .limit(10)
      .getMany();
  }
}