import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Import Entities (Model) từ các module khác
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { User } from '../users/entities/user.entity';
import { Community } from '../communities/entities/community.entity';
import { Hashtag } from '../hashtags/entities/hashtag.entity';

// Type cho kết quả post giống Newsfeed
export interface SearchPostItem {
  id: number;
  title: string;
  thumbnailUrl: string | null;
  upVotes: number;
  downVotes: number;
  createdAt: string;
  author: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  community: {
    id: number;
    name: string;
    thumbnailUrl: string | null;
  } | null;
  hashtags: { id: number; name: string }[];
  totalReacts: number;
  totalComments: number;
}

@Injectable()
export class SearchDao {
  constructor(
    @InjectRepository(BlogPost) private postRepo: Repository<BlogPost>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Community) private communityRepo: Repository<Community>,
    @InjectRepository(Hashtag) private hashtagRepo: Repository<Hashtag>,
  ) {}

  // Tìm kiếm bài viết theo tiêu đề - trả về format giống Newsfeed
  async searchPosts(keyword: string): Promise<SearchPostItem[]> {
    // Query lấy posts với đầy đủ thông tin
    const query = `
      SELECT 
        p.id,
        p.title,
        p."thumbnailUrl" as thumbnail_url,
        p."upVotes" as up_votes,
        p."downVotes" as down_votes,
        p."createdAt" as created_at,
        p."authorId" as author_id,
        u.username,
        u."avatarUrl" as avatar_url,
        COALESCE(r.reacts, 0)::int as total_reacts,
        COALESCE(cm.comments, 0)::int as total_comments,
        comm.id as community_id,
        comm.name as community_name,
        comm."thumbnailUrl" as community_thumbnail
      FROM blog_posts p
      LEFT JOIN users u ON u.id = p."authorId"
      LEFT JOIN (SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId") r ON r."postId" = p.id
      LEFT JOIN (SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId") cm ON cm."postId" = p.id
      LEFT JOIN community comm ON comm.id = p."communityId"
      WHERE p."isPublic" = true 
        AND p.status = 'ACTIVE'
        AND LOWER(p.title) LIKE $1
      ORDER BY p."createdAt" DESC
    `;

    const rawPosts = await this.postRepo.query(query, [keyword]);

    // Lấy hashtags cho các posts
    const postIds = rawPosts.map((p: any) => Number(p.id));
    const hashtagsMap = await this.getHashtagsForPosts(postIds);

    // Map kết quả
    return rawPosts.map((p: any) => ({
      id: Number(p.id),
      title: p.title || 'Untitled',
      thumbnailUrl: p.thumbnail_url || null,
      upVotes: Number(p.up_votes ?? 0),
      downVotes: Number(p.down_votes ?? 0),
      createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
      author: {
        id: p.author_id ? Number(p.author_id) : 0,
        username: p.username || 'Anonymous',
        avatarUrl: p.avatar_url || null,
      },
      community: p.community_id
        ? {
            id: Number(p.community_id),
            name: p.community_name || '',
            thumbnailUrl: p.community_thumbnail || null,
          }
        : null,
      hashtags: hashtagsMap[String(p.id)] || [],
      totalReacts: Number(p.total_reacts ?? 0),
      totalComments: Number(p.total_comments ?? 0),
    }));
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

  // Tìm kiếm bài viết theo hashtag - trả về format giống Newsfeed
  async searchHashtags(keyword: string): Promise<SearchPostItem[]> {
    // Query lấy posts có hashtag matching với đầy đủ thông tin
    const query = `
      SELECT DISTINCT
        p.id,
        p.title,
        p."thumbnailUrl" as thumbnail_url,
        p."upVotes" as up_votes,
        p."downVotes" as down_votes,
        p."createdAt" as created_at,
        p."authorId" as author_id,
        u.username,
        u."avatarUrl" as avatar_url,
        COALESCE(r.reacts, 0)::int as total_reacts,
        COALESCE(cm.comments, 0)::int as total_comments,
        comm.id as community_id,
        comm.name as community_name,
        comm."thumbnailUrl" as community_thumbnail
      FROM blog_posts p
      INNER JOIN post_hashtags ph ON ph."postId" = p.id
      INNER JOIN hashtags h ON h.id = ph."hashtagId"
      LEFT JOIN users u ON u.id = p."authorId"
      LEFT JOIN (SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId") r ON r."postId" = p.id
      LEFT JOIN (SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId") cm ON cm."postId" = p.id
      LEFT JOIN community comm ON comm.id = p."communityId"
      WHERE p."isPublic" = true 
        AND p.status = 'ACTIVE'
        AND LOWER(h.name) LIKE $1
      ORDER BY p."createdAt" DESC
    `;

    const rawPosts = await this.postRepo.query(query, [keyword]);

    // Lấy hashtags cho các posts
    const postIds = rawPosts.map((p: any) => Number(p.id));
    const hashtagsMap = await this.getHashtagsForPosts(postIds);

    // Map kết quả
    return rawPosts.map((p: any) => ({
      id: Number(p.id),
      title: p.title || 'Untitled',
      thumbnailUrl: p.thumbnail_url || null,
      upVotes: Number(p.up_votes ?? 0),
      downVotes: Number(p.down_votes ?? 0),
      createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
      author: {
        id: p.author_id ? Number(p.author_id) : 0,
        username: p.username || 'Anonymous',
        avatarUrl: p.avatar_url || null,
      },
      community: p.community_id
        ? {
            id: Number(p.community_id),
            name: p.community_name || '',
            thumbnailUrl: p.community_thumbnail || null,
          }
        : null,
      hashtags: hashtagsMap[String(p.id)] || [],
      totalReacts: Number(p.total_reacts ?? 0),
      totalComments: Number(p.total_comments ?? 0),
    }));
  }

  // Helper: Lấy hashtags cho danh sách posts
  private async getHashtagsForPosts(postIds: number[]): Promise<Record<string, { id: number; name: string }[]>> {
    if (postIds.length === 0) return {};

    const hashtagsQuery = `
      SELECT 
        ph."postId" as post_id,
        h.id,
        h.name
      FROM post_hashtags ph
      JOIN hashtags h ON h.id = ph."hashtagId"
      WHERE ph."postId" = ANY($1::bigint[])
      ORDER BY ph."postId", h.name
    `;

    const hashtagsResult: { post_id: number; id: number; name: string }[] = 
      await this.postRepo.query(hashtagsQuery, [postIds]);

    // Group hashtags by postId
    return hashtagsResult.reduce<Record<string, { id: number; name: string }[]>>((acc, row) => {
      const postId = String(row.post_id);
      if (!acc[postId]) acc[postId] = [];
      acc[postId].push({ id: Number(row.id), name: row.name });
      return acc;
    }, {});
  }

  // Tìm kiếm tất cả loại (sử dụng Promise.all để tăng hiệu suất)
  async searchAll(keyword: string) {
    const [posts, users, communities, hashtagPosts] = await Promise.all([
      this.searchPosts(keyword),
      this.searchUsers(keyword),
      this.searchCommunities(keyword),
      this.searchHashtags(keyword)
    ]);

    return {
      posts,
      users,
      communities,
      hashtagPosts, // Posts từ hashtag search
      total: posts.length + users.length + communities.length + hashtagPosts.length
    };
  }
}
