import { Injectable } from '@nestjs/common';
import { SearchDto } from './dto/search.dto';
import { PostResponseDto } from 'src/blog-posts/dto/response/blog-post-response.dto';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Raw, Repository, Brackets } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';
import { Community } from 'src/communities/entities/community.entity';
import { SearchResponseDto, SearchPaginationDto } from './dto/response/search-response.dto';
import { UserVotesService } from 'src/user-votes/user-votes.service';
import { UserReactQueryService } from 'src/user-reacts/services/user-react-query.service';

interface CursorInfo {
  id: number | null;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly userVotesService: UserVotesService,

    private readonly userReactsQueryService: UserReactQueryService,

    @InjectRepository(BlogPost)
    private readonly blogPostRepository: Repository<BlogPost>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
  ) {}

  private parseCursor(after?: string | null): CursorInfo {
    if (!after) return { id: null };
    try {
      const decoded = Buffer.from(after, 'base64').toString('utf-8');
      return { id: Number(decoded) || null };
    } catch {
      return { id: null };
    }
  }

  private createCursor(id: number): string {
    return Buffer.from(String(id)).toString('base64');
  }

  /**
   * Search all types (Used by Search Sidebar)
   */
  async search(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q, limit = 15, after } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const cursor = this.parseCursor(after);

    let postsQuery = this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.hashtags', 'hashtag')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .leftJoin('post.blocks', 'block')
      .leftJoin('post.blocks', 'block')
      .where(
        new Brackets((qb) => {
          qb.where('LOWER(post.title) ILIKE :keyword', { keyword })
            .orWhere('LOWER(hashtag.name) ILIKE :keyword', { keyword })
            .orWhere('LOWER(block.content) ILIKE :keyword', { keyword });
        }),
      );

    if (cursor.id !== null) {
      postsQuery = postsQuery.andWhere('post.id < :cursorId', { cursorId: cursor.id });
    }

    const posts = await postsQuery
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('post.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const lastPost = paginatedPosts[paginatedPosts.length - 1];

    // Users và Communities chỉ load ở trang đầu tiên
    let users: User[] = [];
    let communities: Community[] = [];

    if (!after) {
      users = await this.userRepository.find({
        where: [{ username: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) }],
        take: 5,
      });

      communities = await this.communityRepository.find({
        where: [{ name: Raw((alias) => `LOWER(${alias}) ILIKE '${keyword}'`) }],
        take: 5,
      });
    }

    const pagination: SearchPaginationDto = {
      hasMore,
      nextCursor: hasMore && lastPost ? this.createCursor(lastPost.id) : null,
    };

    return {
      posts: paginatedPosts.map((post) => plainToInstance(PostResponseDto, post)),
      users,
      communities,
      pagination,
    };
  }

  /**
   * 2. TÌM RIÊNG BÀI VIẾT (Tab "Bài viết")
   * Logic: Phân trang đầy đủ
   */
  async searchByPost(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q, limit = 15, after } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const cursor = this.parseCursor(after);

    let postsQuery = this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.hashtags', 'hashtag')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .leftJoin('post.blocks', 'block')
      .where(
        new Brackets((qb) => {
          qb.where('LOWER(post.title) ILIKE :keyword', { keyword })
            .orWhere('LOWER(hashtag.name) ILIKE :keyword', { keyword })
            .orWhere('LOWER(block.content) ILIKE :keyword', { keyword });
        }),
      );

    if (cursor.id !== null) {
      postsQuery = postsQuery.andWhere('post.id < :cursorId', { cursorId: cursor.id });
    }

    const posts = await postsQuery
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('post.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const lastPost = paginatedPosts[paginatedPosts.length - 1];

    const pagination: SearchPaginationDto = {
      hasMore,
      nextCursor: hasMore && lastPost ? this.createCursor(lastPost.id) : null,
    };

    const reactsMap = await this.userReactsQueryService.getUserReactForPosts(
      paginatedPosts.map((post) => post.id),
    );
    const votesMap = await this.userVotesService.getPostsVotes(
      paginatedPosts.map((post) => post.id),
    );

    return {
      posts: paginatedPosts.map((post) => {
        const result = plainToInstance(PostResponseDto, post);
        result['reacts'] = reactsMap.get(post.id);
        result['votes'] = votesMap.get(post.id);
        return result;
      }),
      pagination,
    };
  }

  async searchByUser(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q, limit = 15, after } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const cursor = this.parseCursor(after);

    let usersQuery = this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) ILIKE :keyword', { keyword });

    if (cursor.id !== null) {
      usersQuery = usersQuery.andWhere('user.id < :cursorId', { cursorId: cursor.id });
    }

    const users = await usersQuery
      .orderBy('user.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = users.length > limit;
    const paginatedUsers = hasMore ? users.slice(0, limit) : users;
    const lastUser = paginatedUsers[paginatedUsers.length - 1];

    const pagination: SearchPaginationDto = {
      hasMore,
      nextCursor: hasMore && lastUser ? this.createCursor(lastUser.id) : null,
    };

    return { users: paginatedUsers, pagination };
  }

  /**
   * 4. TÌM RIÊNG COMMUNITY (Tab "Cộng đồng")
   * Logic: Phân trang đầy đủ
   */
  async searchByCommunity(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q, limit = 15, after } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const cursor = this.parseCursor(after);

    let communitiesQuery = this.communityRepository
      .createQueryBuilder('community')
      .where('LOWER(community.name) ILIKE :keyword', { keyword });

    if (cursor.id !== null) {
      communitiesQuery = communitiesQuery.andWhere('community.id < :cursorId', {
        cursorId: cursor.id,
      });
    }

    const communities = await communitiesQuery
      .orderBy('community.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = communities.length > limit;
    const paginatedCommunities = hasMore ? communities.slice(0, limit) : communities;
    const lastCommunity = paginatedCommunities[paginatedCommunities.length - 1];

    const pagination: SearchPaginationDto = {
      hasMore,
      nextCursor: hasMore && lastCommunity ? this.createCursor(lastCommunity.id) : null,
    };

    return { communities: paginatedCommunities, pagination };
  }

  /**
   * 5. TÌM RIÊNG HASHTAG
   * Logic: Tìm bài viết chứa hashtag đó -> Phân trang bài viết
   */
  async searchByHashtag(searchDto: SearchDto): Promise<SearchResponseDto> {
    const { q, limit = 15, after } = searchDto;
    const keyword = `%${q.toLowerCase()}%`;
    const cursor = this.parseCursor(after);

    let postsQuery = this.blogPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.hashtags', 'hashtag')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.community', 'community')
      .where('LOWER(hashtag.name) ILIKE :keyword', { keyword });

    if (cursor.id !== null) {
      postsQuery = postsQuery.andWhere('post.id < :cursorId', { cursorId: cursor.id });
    }

    const posts = await postsQuery
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('post.id', 'DESC')
      .take(limit + 1)
      .getMany();

    const hasMore = posts.length > limit;
    const paginatedPosts = hasMore ? posts.slice(0, limit) : posts;
    const lastPost = paginatedPosts[paginatedPosts.length - 1];

    const pagination: SearchPaginationDto = {
      hasMore,
      nextCursor: hasMore && lastPost ? this.createCursor(lastPost.id) : null,
    };

    return {
      posts: paginatedPosts.map((post) => plainToInstance(PostResponseDto, post)),
      pagination,
    };
  }
}
