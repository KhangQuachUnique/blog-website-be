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

    switch (type) {
      // 1. Tìm kiếm bài viết theo tiêu đề
      case SearchType.POST:
        return this.postRepo.createQueryBuilder('post')
          .leftJoinAndSelect('post.author', 'author') // Join để lấy thông tin tác giả
          .select(['post.id', 'post.title', 'post.createdAt', 'author.username', 'author.avatarUrl'])
          .where('LOWER(post.title) LIKE :keyword', { keyword })
          .andWhere('post.isPublic = :isPublic', { isPublic: true })
          .orderBy('post.createdAt', 'DESC')
          .getMany();

      // 2. Tìm kiếm người dùng theo username
      case SearchType.USER:
        return this.userRepo.createQueryBuilder('user')
          .select(['user.id', 'user.username', 'user.avatarUrl', 'user.bio'])
          .where('LOWER(user.username) LIKE :keyword', { keyword })
          .getMany();

      // 3. Tìm kiếm cộng đồng theo tên
      case SearchType.COMMUNITY:
        return this.communityRepo.createQueryBuilder('community')
          .where('LOWER(community.name) LIKE :keyword', { keyword })
          .andWhere('community.isPublic = :isPublic', { isPublic: true })
          .getMany();

      // 4. Tìm bài viết theo Hashtag (Chính xác hashtag)
      case SearchType.HASHTAG:
        // Logic: Tìm bài viết -> join bảng trung gian post_hashtags -> join bảng hashtags
        return this.postRepo.createQueryBuilder('post')
          .innerJoin('post_hashtags', 'ph', 'ph.postId = post.id')
          .innerJoin('hashtags', 'h', 'h.id = ph.hashtagId')
          .leftJoinAndSelect('post.author', 'author')
          .where('LOWER(h.name) = LOWER(:tag)', { tag: q }) // Tìm chính xác tên tag
          .andWhere('post.isPublic = :isPublic', { isPublic: true })
          .getMany();

      default:
        return [];
    }
  }
}