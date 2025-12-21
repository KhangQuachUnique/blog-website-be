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
   * 1. TÌM KIẾM TỔNG HỢP (Dùng cho Sidebar hoặc Tab "Tất cả")
   * Logic: 
   * - Bài viết: Phân trang theo scroll (lấy 10, 20...).
   * - User/Community: Chỉ lấy Top 5 phù hợp nhất, KHÔNG cuộn theo bài viết.
   */
  async search(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    
    // Pagination cho POSTS
    const take = searchDto.take ?? 10;
    const skip = searchDto.skip ?? 0;

    // 1.1 Tìm Posts (Có phân trang)
    const [posts, postsTotal] = await this.blogPostRepository
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
      .take(take)
      .skip(skip)
      .getManyAndCount();

    // 1.2 Tìm Users (Fix cứng 5 người, không skip)
    // Lý do: Khi user cuộn bài viết xuống trang 2, ta vẫn muốn giữ nguyên danh sách gợi ý User tốt nhất ở đầu.
    const [users, usersTotal] = await this.userRepository.findAndCount({
      where: [
        { username: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) },
        { email: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) } // Tìm thêm theo email nếu muốn
      ],
      take: 5, 
      skip: 0, 
    });

    // 1.3 Tìm Communities (Fix cứng 5 nhóm)
    const [communities, communitiesTotal] = await this.communityRepository.findAndCount({
      where: [
        { name: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) },
      ],
      take: 5,
      skip: 0,
    });

    return {
      posts: posts.map((post) => plainToInstance(PostResponseDto, post)),
      // Lưu ý: Nếu User entity chứa password, hãy dùng plainToInstance(UserResponseDto, user) để ẩn đi
      users: users, 
      communities: communities,
      meta: {
        postsTotal: postsTotal,
        postsHasMore: skip + posts.length < postsTotal, // Logic check xem còn bài để cuộn không
        usersTotal: usersTotal,
        communitiesTotal: communitiesTotal,
      }
    };
  }

  /**
   * 2. TÌM RIÊNG BÀI VIẾT (Tab "Bài viết")
   * Logic: Phân trang đầy đủ
   */
  async searchByPost(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const take = searchDto.take ?? 10;
    const skip = searchDto.skip ?? 0;

    const [posts, total] = await this.blogPostRepository
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
      .take(take)
      .skip(skip)
      .getManyAndCount();

    return {
      posts: posts.map((post) => plainToInstance(PostResponseDto, post)),
      meta: { 
        postsTotal: total, 
        postsHasMore: skip + posts.length < total 
      }
    };
  }
  
  /**
   * 3. TÌM RIÊNG USER (Tab "Người dùng")
   * Logic: Phân trang đầy đủ (khác với hàm search tổng hợp)
   */
  async searchByUser(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const take = searchDto.take ?? 10;
    const skip = searchDto.skip ?? 0;

    const [users, total] = await this.userRepository.findAndCount({
      where: [
        { username: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) }
      ],
      take,
      skip,
    });

    return { 
      users, 
      meta: { 
        usersTotal: total,
        // Frontend có thể dùng biến này để biết khi nào dừng cuộn list user
        usersHasMore: skip + users.length < total 
      } as any // Ép kiểu nếu metaDto chưa định nghĩa usersHasMore (bạn có thể thêm vào DTO sau)
    };
  }

  /**
   * 4. TÌM RIÊNG COMMUNITY (Tab "Cộng đồng")
   * Logic: Phân trang đầy đủ
   */
  async searchByCommunity(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const take = searchDto.take ?? 10;
    const skip = searchDto.skip ?? 0;

    const [communities, total] = await this.communityRepository.findAndCount({
      where: [{ name: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) }],
      take,
      skip,
    });

    return { 
      communities, 
      meta: { 
        communitiesTotal: total,
        communitiesHasMore: skip + communities.length < total
      } as any 
    };
  }

  /**
   * 5. TÌM RIÊNG HASHTAG
   * Logic: Tìm bài viết chứa hashtag đó -> Phân trang bài viết
   */
  async searchByHashtag(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const take = searchDto.take ?? 10;
    const skip = searchDto.skip ?? 0;

    const [posts, total] = await this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.hashtags', 'hashtag')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .where('LOWER(hashtag.name) ILIKE :keyword', { keyword })
      .orderBy('post.createdAt', 'DESC')
      .take(take)
      .skip(skip)
      .getManyAndCount();

    return { 
      posts: posts.map((post) => plainToInstance(PostResponseDto, post)), 
      meta: { 
        postsTotal: total, 
        postsHasMore: skip + posts.length < total 
      } 
    };
  }
}