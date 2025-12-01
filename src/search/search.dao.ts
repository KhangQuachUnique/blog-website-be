import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import Entities (Model) từ các module khác
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { User } from '../users/entities/user.entity';
import { Community } from '../communities/entities/community.entity';
import { Hashtag } from '../hashtags/entities/hashtag.entity';

@Injectable()
export class SearchDao {
  constructor(
    @InjectRepository(BlogPost) private postRepo: Repository<BlogPost>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Community) private communityRepo: Repository<Community>,
    @InjectRepository(Hashtag) private hashtagRepo: Repository<Hashtag>,
  ) {}

  // Tìm kiếm bài viết theo tiêu đề
  async searchPosts(keyword: string): Promise<BlogPost[]> {
    return this.postRepo.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select(['post.id', 'post.title', 'post.createdAt', 'author.username', 'author.avatarUrl'])
      .where('LOWER(post.title) LIKE :keyword', { keyword })
      .andWhere('post.isPublic = :isPublic', { isPublic: true })
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }

  // Tìm kiếm người dùng theo username
  async searchUsers(keyword: string): Promise<User[]> {
    return this.userRepo.createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.avatarUrl', 'user.bio'])
      .where('LOWER(user.username) LIKE :keyword', { keyword })
      .getMany();
  }

  // Tìm kiếm cộng đồng theo tên
  async searchCommunities(keyword: string): Promise<Community[]> {
    return this.communityRepo.createQueryBuilder('community')
      .where('LOWER(community.name) LIKE :keyword', { keyword })
      .andWhere('community.isPublic = :isPublic', { isPublic: true })
      .getMany();
  }

  // Tìm kiếm bài viết theo hashtag (trả về posts có hashtag đó)
  async searchHashtags(keyword: string): Promise<BlogPost[]> {
    return this.postRepo.createQueryBuilder('post')
      .innerJoin('post_hashtags', 'ph', 'ph.postId = post.id')
      .innerJoin('hashtags', 'h', 'h.id = ph.hashtagId')
      .leftJoinAndSelect('post.author', 'author')
      .select(['post.id', 'post.title', 'post.createdAt', 'author.username', 'author.avatarUrl'])
      .where('LOWER(h.name) LIKE :keyword', { keyword })
      .andWhere('post.isPublic = :isPublic', { isPublic: true })
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }

  // Tìm kiếm tất cả loại (sử dụng Promise.all để tăng hiệu suất)
  async searchAll(keyword: string) {
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
}
