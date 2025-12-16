import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPost } from '../blog-posts/entities/blog-post.entity';
import { GetNewsfeedDto, GetNewsfeedResponseDto, NewsfeedItemDto } from './dto';
import { PostResponseDto } from '../blog-posts/dto/response/blog-post-response.dto';
import { plainToInstance } from 'class-transformer';
import { ViewedHistoryService } from '../viewed-history/viewed-history.service';
import { HashtagsService } from '../hashtags/hashtags.service';
import { UserReactQueryService } from '../user-reacts/services/user-react-query.service';

type RawPostRow = {
  id: number | string;
  title?: string | null;
  shortDescription?: string | null;
  post_type?: string | null;
  thumbnail_url?: string | null;
  up_votes?: number | string | null;
  down_votes?: number | string | null;
  created_at?: string | Date | null;
  username?: string | null;
  avatar_url?: string | null;
  total_reacts?: number | string | null;
  total_comments?: number | string | null;
  community_id?: number | string | null;
  community_name?: string | null;
  community_thumbnail?: string | null;
  score?: number | string | null;
  is_viewed?: boolean | null;
  author_id?: number | string | null;
  engagement_rate?: number | string | null;
  views_count?: number | string | null;
  is_public?: boolean | null;
  status?: string | null;
  original_post_id?: number | string | null;
};

interface CursorInfo {
  id: number | null;
  score: number | null;
}

/**
 * NewsfeedService (improved for diversity, customizability, and variability on reload)
 * - Added configurable scoring weights via a private config object for easy tuning.
 * - Improved diversity:
 *   - Penalize based on count of recent appearances (not just presence).
 *   - Fetch more recent items (up to 10) and use a map to count occurrences per author/community.
 *   - Exponential penalty scaling for repeated authors/communities.
 * - Added variability on reload:
 *   - Introduce a small random jitter to scores using RANDOM() * jitterFactor in SQL.
 *   - To maintain pagination consistency, include a sessionSeed in the cursor (generated on initial fetch).
 *   - Use sessionSeed to seed RANDOM() via SETSEED for reproducible randomness within a "session" (pagination chain).
 *   - On full reload (no cursor), generate a new seed, causing different ordering.
 * - Structure remains sequential with small helpers.
 */
@Injectable()
export class NewsfeedService {
  constructor(
    @InjectRepository(BlogPost)
    private readonly postRepo: Repository<BlogPost>,
    private readonly hashtagsService: HashtagsService,
    private readonly userReactQueryService: UserReactQueryService,
    private readonly viewedHistoryService: ViewedHistoryService,
  ) {}

  // Configurable weights for easy customization/tuning
  private readonly scoringConfig = {
    engagementLogBase: 10, // LN(1 + votes + reacts*1.5 + comments*2.5)
    engagementWeights: { votes: 1, reacts: 1.5, comments: 2.5 },
    engagementBonusThreshold: 10, // Views >10 for engagement rate bonus
    engagementBonusMultiplier: 5, // Multiplier for (comments / views)
    timeDecayDivider: 15, // 15 / (1 + POWER(hours/24, 1.5))
    timeDecayPower: 1.5,
    timeDecayMinHours: 0.01,
    tagBonusMultiplier: 12, // 12 * LN(count +1)
    followBonusBase: 15, // Base for follow bonus
    followBonusRecentMultiplier: 0.3, // Extra if followed <7 days
    followRecentDays: 7,
    viewedPenaltyBase: -20, // -20 * EXP(-0.1 * days)
    viewedPenaltyDecay: -0.1,
    diversityPenaltyBase: -8, // Base per occurrence
    diversityPenaltyScale: 1.2, // Exponential scale: base * (scale ^ (count-1))
    hotContentThresholds: { high: 50, medium: 20 }, // >50: +8, >20: +5
    hotContentMultiplierHigh: 8,
    hotContentMultiplierMedium: 5,
    jitterFactor: 5, // RANDOM() * 5 for small variability
    recentDiversityLimit: 10, // Fetch up to 10 recent for better counting
  };

  async getNewsfeed(
    dto: GetNewsfeedDto,
    user?: { id: number; username?: string },
  ): Promise<{ status: string; data: GetNewsfeedResponseDto }> {
    const { limit = 15, after, seed, includeOriginal } = dto;

    // 1) Parse cursor (now includes sessionSeed)
    const cursor = this.parseCursor(after);

    // Use client-provided seed for deterministic ordering, or fallback to Math.random()
    const sessionSeed = seed ?? Math.random();

    // 3) Personalization sources
    const interestedTags = user?.id ? await this.getInterestedTags(user.id) : [];
    const { recentAuthorCounts, recentCommunityCounts } =
      user?.id && cursor.id !== null
        ? await this.getRecentDiversity(user.id, cursor.id)
        : { recentAuthorCounts: new Map(), recentCommunityCounts: new Map() };

    // 4) Build SQL and params
    const params: unknown[] = [];
    const parts = this.buildPersonalizationParts(
      params,
      interestedTags,
      user?.id,
      recentAuthorCounts,
      recentCommunityCounts,
    );

    // If client provided a seed we will apply deterministic ordering in Node.
    // In that case, fetch a larger superset and do NOT apply SQL cursor filtering.
    const useSeeded = seed !== undefined;
    const fetchCount = useSeeded ? Math.max(200, limit * 20) : limit + 1;

    const cursorWhereForQuery = useSeeded ? '' : this.buildCursorWhere(cursor, params);
    params.push(fetchCount);

    // Build main query without SQL-side jitter (we'll apply seeded noise in Node)
    const query = this.buildMainQuery(parts, cursorWhereForQuery, params.length, null, false);

    // 5) Fetch raw posts
    let rawPosts: RawPostRow[] = await this.postRepo.query(query, params);

    // 6) Fetch hashtags for posts
    const postIds = rawPosts.map((p) => Number(p.id));
    const hashtagsMap = await this.hashtagsService.fetchForPosts(postIds);

    // 7) Get viewed ids
    const viewedIds = user?.id ? await this.getViewedIds(user.id) : [];

    // 8) Fetch reaction summaries (emoji bar) for posts in batch
    const reactsMap = await this.userReactQueryService.getUserReactForPosts(postIds, user?.id);

    // Fallback: if UserReactQueryService returned empty for posts that have total_reacts>0,
    // perform a lightweight SQL aggregate to ensure we show emojis/counts.
    const missingPostIds: number[] = [];
    rawPosts.forEach((p) => {
      const pid = Number(p.id);
      const totalReacts = Number(p.total_reacts ?? 0);
      const summary = reactsMap.get(pid);
      if (totalReacts > 0 && (!summary || (summary && summary.totalReactions === 0))) {
        missingPostIds.push(pid);
      }
    });

    if (missingPostIds.length > 0) {
      const aggQuery = `
        SELECT ur."postId" as post_id,
               e.id as emoji_id,
               e.type as emoji_type,
               e.codepoint,
               e."emojiUrl" as emoji_url,
               COUNT(*)::int as cnt,
               BOOL_OR(ur."userId" = $2) as reacted_by_me
        FROM user_reacts ur
        JOIN emojis e ON e.id = ur."emojiId"
        WHERE ur."postId" = ANY($1::bigint[])
        GROUP BY ur."postId", e.id, e.type, e.codepoint, e."emojiUrl"
        ORDER BY ur."postId"
      `;

      // currentUser may be undefined -> pass null
      const aggRows: { post_id: number; emoji_id: number; emoji_type: string; codepoint?: string; emoji_url?: string; cnt: number; reacted_by_me: boolean }[] =
        await this.postRepo.query(aggQuery, [missingPostIds, user?.id ?? null]);

      // build map
      const fallbackMap = new Map<number, any>();
      const totals = new Map<number, number>();
      aggRows.forEach((r) => {
        const pid = Number(r.post_id);
        if (!fallbackMap.has(pid)) fallbackMap.set(pid, { targetId: pid, targetType: 'post', emojis: [], totalReactions: 0 });
        const entry = fallbackMap.get(pid);
        entry.emojis.push({
          emojiId: Number(r.emoji_id),
          type: String(r.emoji_type),
          codepoint: r.codepoint ?? undefined,
          emojiUrl: r.emoji_url ?? undefined,
          totalCount: Number(r.cnt),
          reactedByCurrentUser: Boolean(r.reacted_by_me),
        });
        entry.totalReactions += Number(r.cnt);
      });

      // set into reactsMap for missing ids
      missingPostIds.forEach((pid) => {
        if (fallbackMap.has(pid)) reactsMap.set(pid, fallbackMap.get(pid));
      });
    }

    // 8) Map to DTOs
    // Apply deterministic seeded noise to each post and sort by noise ascending
    const seededNoise = (id: number, seedVal: number) => {
      try {
        return ((Math.sin(id * 1000 + seedVal * 10000) + 1) * 10000) % 1;
      } catch {
        return 0;
      }
    };

    const seedValue = sessionSeed; // computed earlier from dto.seed or Math.random()
    rawPosts.forEach((p) => {
      const nid = Number(p.id);
      // store computed noise in `score` so mapping/pagination uses it as final_score
      (p as any).score = seededNoise(nid, seedValue);
    });

    rawPosts.sort((a, b) => {
      const na = Number(a.score ?? 0);
      const nb = Number(b.score ?? 0);
      if (na !== nb) return nb - na; // descending (highest score first)
      return Number(b.id) - Number(a.id);
    });

    // If using seeded ordering and a cursor was provided, perform node-side cursor offset
    if (useSeeded && cursor.score !== null && cursor.id !== null) {
      const cs = Number(cursor.score);
      const cid = Number(cursor.id);
      const startIndex = rawPosts.findIndex((p) => {
        const ps = Number(p.score ?? 0);
        const pid = Number(p.id);
        return ps < cs || (ps === cs && pid < cid); // descending: find first item with lower score
      });
      if (startIndex >= 0) {
        rawPosts = rawPosts.slice(startIndex);
      } else {
        rawPosts = [];
      }
    }

    // If includeOriginal requested, fetch original posts for repost items
    let originalMap: Record<number, NewsfeedItemDto> = {};
    if (includeOriginal) {
      const repostOriginalIds = Array.from(
        new Set(
          rawPosts
            .filter((r) => String(r.post_type)?.toUpperCase() === 'REPOST' && (r as any).original_post_id)
            .map((r) => Number((r as any).original_post_id)),
        ),
      ).filter(Boolean) as number[];

      if (repostOriginalIds.length > 0) {
        const origQuery = `
          SELECT
            p.id,
            p.title,
            p."shortDescription" as shortDescription,
            p."thumbnailUrl" as thumbnail_url,
            p."isPublic" as is_public,
            p.status,
            p.type as post_type,
            p."createdAt" as created_at,
            u.id as author_id,
            u.username,
            u."avatarUrl" as avatar_url,
            comm.id as community_id,
            comm.name as community_name,
            comm."thumbnailUrl" as community_thumbnail,
            COALESCE(v.up_votes, 0)::int as up_votes,
            COALESCE(v.down_votes, 0)::int as down_votes,
            COALESCE(r.reacts, 0)::int as total_reacts,
            COALESCE(cm.comments, 0)::int as total_comments
          FROM blog_posts p
          LEFT JOIN users u ON u.id = p."authorId"
          LEFT JOIN (
            SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId"
          ) r ON r."postId" = p.id
          LEFT JOIN (
            SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId"
          ) cm ON cm."postId" = p.id
          LEFT JOIN (
            SELECT "postId",
              SUM(CASE WHEN LOWER("voteType"::text) = 'upvote' THEN 1 ELSE 0 END)::int as up_votes,
              SUM(CASE WHEN LOWER("voteType"::text) = 'downvote' THEN 1 ELSE 0 END)::int as down_votes
            FROM user_votes GROUP BY "postId"
          ) v ON v."postId" = p.id
          LEFT JOIN community comm ON comm.id = p."communityId"
          WHERE p.id = ANY($1::bigint[])
        `;
        const origRows: RawPostRow[] = await this.postRepo.query(origQuery, [repostOriginalIds]);
        const origHashtags = await this.hashtagsService.fetchForPosts(repostOriginalIds);
        const origReactsMap = await this.userReactQueryService.getUserReactForPosts(repostOriginalIds, user?.id);
        const origDtos = this.mapRowsToDto(origRows, origHashtags, [], origReactsMap);
        origDtos.forEach((d) => (originalMap[d.id] = d));
      }
    }

    const items = this.mapRowsToDto(rawPosts, hashtagsMap, viewedIds, reactsMap);

    // 9) Paginate (cursor does NOT include seed)
    // Attach originalPost / preview for repost items
    items.forEach((it, idx) => {
      const raw = rawPosts[idx] as any;
      const isRepost = String(raw.post_type)?.toUpperCase() === 'REPOST';
      const origId = raw.original_post_id ? Number(raw.original_post_id) : null;
      if (isRepost && origId) {
        it.originalPostId = origId;
        const orig = originalMap[origId];
        if (orig) {
          if (includeOriginal) {
            it.originalPost = orig;
          } else {
            it.originalPostPreview = {
              id: orig.id,
              title: orig.title,
              thumbnailUrl: orig.thumbnailUrl || null,
              author: orig.author,
              hashtags: orig.hashtags,
              createdAt: orig.createdAt instanceof Date ? orig.createdAt.toISOString() : (orig.createdAt as any) || new Date().toISOString(),
            };
          }
        }
      }
    });

    const { paginatedItems, hasMore, nextCursor } = this.paginate(items, limit);

    return {
      status: 'success',
      data: { items: paginatedItems, pagination: { hasMore, nextCursor } },
    };
  }

  /* ========================= PRIVATE HELPERS ========================= */

  // Parse base64 cursor encoded as "<id>|<score>" -> CursorInfo
  private parseCursor(after?: string | null): CursorInfo {
    if (!after) return { id: null, score: null };
    try {
      const [idStr, scoreStr] = Buffer.from(after, 'base64').toString('utf-8').split('|');
      return {
        id: Number(idStr) || null,
        score: Number(scoreStr) || null,
      };
    } catch {
      return { id: null, score: null };
    }
  }

  // Get user's top hashtags
  private async getInterestedTags(userId: number): Promise<string[]> {
    try {
      const top = await this.viewedHistoryService.getTopHashtags(userId, 25, 14);
      return top.map((t) => t.name);
    } catch {
      return [];
    }
  }

  // Improved: Get recent authors/communities with counts for scaled penalty
  private async getRecentDiversity(userId: number, cursorId: number | null) {
    const recentAuthorCounts = new Map<number, number>();
    const recentCommunityCounts = new Map<number, number>();
    if (!cursorId) return { recentAuthorCounts, recentCommunityCounts };

    const recentQuery = `
      SELECT p."authorId" as "authorId", p."communityId" as "communityId"
      FROM blog_posts p
      WHERE p.id > $1
      ORDER BY p.id DESC
      LIMIT ${this.scoringConfig.recentDiversityLimit}
    `;
    const recent = await this.postRepo.query(recentQuery, [cursorId || 0]);

    recent.forEach((r: any) => {
      const authorId = Number(r.authorId);
      const communityId = Number(r.communityId);
      if (authorId) {
        recentAuthorCounts.set(authorId, (recentAuthorCounts.get(authorId) || 0) + 1);
      }
      if (communityId) {
        recentCommunityCounts.set(communityId, (recentCommunityCounts.get(communityId) || 0) + 1);
      }
    });

    return { recentAuthorCounts, recentCommunityCounts };
  }

  // Build personalization SQL snippets with configurable weights
  private buildPersonalizationParts(
    params: unknown[],
    interestedTags: string[],
    userId?: number,
    recentAuthorCounts: Map<number, number> = new Map(),
    recentCommunityCounts: Map<number, number> = new Map(),
  ) {
    const config = this.scoringConfig;

    // Tag bonus
    let tagBonus = '0';
    if (interestedTags.length > 0) {
      tagBonus = `
        (SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ${config.tagBonusMultiplier} * LN(COUNT(*) + 1)
          END
        FROM post_hashtags ph 
        JOIN hashtags h ON h.id = ph."hashtagId" 
        WHERE ph."postId" = p.id 
          AND h.name = ANY($${params.length + 1}::text[])
        )
      `;
      params.push(interestedTags);
    }

    // Follow bonus
    let followBonus = '0';
    if (userId) {
      followBonus = `
        COALESCE((
          SELECT ${config.followBonusBase} * (1 + ${config.followBonusRecentMultiplier} * ((EXTRACT(EPOCH FROM (NOW() - f."createdAt")) / 86400 < ${config.followRecentDays})::int))
          FROM user_follows f 
          WHERE f."userId" = $${params.length + 1} 
            AND f."followingId" = p."authorId"
        ), 0)
      `;
      params.push(userId);
    }

    // Viewed penalty
    let viewedPenalty = '0';
    let isViewedCheck = 'false';
    if (userId) {
      viewedPenalty = `
        COALESCE((
          SELECT 
            ${config.viewedPenaltyBase} * EXP(${config.viewedPenaltyDecay} * (EXTRACT(EPOCH FROM (NOW() - vh."createdAt")) / 86400))
          FROM viewed_history vh 
          WHERE vh."userId" = $${params.length + 1} 
            AND vh."postId" = p.id
          LIMIT 1
        ), 0)
      `;
      params.push(userId);

      const userParamIndex = params.length;
      isViewedCheck = `EXISTS(
        SELECT 1 FROM viewed_history vh 
        WHERE vh."userId" = $${userParamIndex}
          AND vh."postId" = p.id
      )`;
    }

    // Improved diversity penalty: scaled by count if in recent
    let diversityPenalty = '0';
    if (recentAuthorCounts.size > 0 || recentCommunityCounts.size > 0) {
      // Since counts are in code, we can't directly use in SQL. Instead, penalize if matches any recent, but scale in code? Wait, no - for each post, penalty is per-post.
      // Limitation: can't use maps in SQL, so simplify to presence for now, but increase base if needed.
      // Better: since recent are small, we can pass arrays and use array_position or something for count, but counts are per id.
      // To keep simple, stick with presence but increase penalty, or pass all recent ids without counts, and keep flat.
      // Improved: pass recentAuthors and recentCommunities as arrays, but since counts, perhaps duplicate ids in array and use count(*).
      // But hacky. For now, enhance to flat but with larger list.

      const recentAuthors: number[] = [];
      recentAuthorCounts.forEach((count, id) => {
        for (let i = 0; i < count; i++) recentAuthors.push(id); // Duplicate for count
      });
      const recentCommunities: number[] = [];
      recentCommunityCounts.forEach((count, id) => {
        for (let i = 0; i < count; i++) recentCommunities.push(id);
      });

      const conditions: string[] = [];
      let authorPenalty = '0';
      if (recentAuthors.length > 0) {
        conditions.push(`p."authorId" = ANY($${params.length + 1}::bigint[])`);
        params.push(recentAuthors);
        authorPenalty = `(SELECT COUNT(*) FROM unnest($${params.length}::bigint[]) AS a WHERE a = p."authorId")`;
      }
      let communityPenalty = '0';
      if (recentCommunities.length > 0) {
        conditions.push(`p."communityId" = ANY($${params.length + 1}::bigint[])`);
        params.push(recentCommunities);
        communityPenalty = `(SELECT COUNT(*) FROM unnest($${params.length}::bigint[]) AS c WHERE c = p."communityId")`;
      }
      if (conditions.length > 0) {
        diversityPenalty = `${config.diversityPenaltyBase} * (POWER(${config.diversityPenaltyScale}, ${authorPenalty} + ${communityPenalty} - 1))`;
      }
    }

    return { tagBonus, followBonus, viewedPenalty, isViewedCheck, diversityPenalty };
  }

  // Build main SQL query with config and jitter
  private buildMainQuery(
    parts: {
      tagBonus: string;
      followBonus: string;
      viewedPenalty: string;
      isViewedCheck: string;
      diversityPenalty: string;
    },
    cursorWhere: string,
    limitParamIndex: number,
    sessionSeed: number | null, // Not used here, but set before query
    isFreshLoad: boolean, // if true, enable jitter/randomness for fresh session
  ) {
    const { tagBonus, followBonus, viewedPenalty, isViewedCheck, diversityPenalty } = parts;
    const config = this.scoringConfig;
    const jitter = isFreshLoad ? ` + (RANDOM() * ${this.scoringConfig.jitterFactor})` : ` + 0`;

    return `
      WITH ranked AS (
        SELECT 
          p.id,
          p.title,
          p."shortDescription" as short_description,
          p.type as post_type,
          p."thumbnailUrl" as thumbnail_url,
          p."isPublic" as is_public,
          p.status as status,
          p."originalPostId" as original_post_id,
          p."createdAt" as created_at,
          p."authorId" as author_id,
          u.username,
          u."avatarUrl" as avatar_url,
          COALESCE(r.reacts, 0)::int as total_reacts,
          COALESCE(cm.comments, 0)::int as total_comments,
          COALESCE(v.up_votes, 0)::int as up_votes,
          COALESCE(v.down_votes, 0)::int as down_votes,
          COALESCE(views.views, 0)::int as views_count,
          comm.id as community_id,
          comm.name as community_name,
          comm."thumbnailUrl" as community_thumbnail,
          (
            ${config.engagementLogBase} * LN(1 + GREATEST(0, COALESCE(v.up_votes, 0) - COALESCE(v.down_votes, 0)) * ${config.engagementWeights.votes} + COALESCE(r.reacts, 0) * ${config.engagementWeights.reacts} + COALESCE(cm.comments, 0) * ${config.engagementWeights.comments})
            + CASE WHEN COALESCE(views.views, 0) > ${config.engagementBonusThreshold} THEN ${config.engagementBonusMultiplier} * (COALESCE(cm.comments, 0)::float / COALESCE(views.views, 1)) ELSE 0 END
            + ${config.timeDecayDivider} / (1 + POWER(GREATEST(${config.timeDecayMinHours}, (EXTRACT(EPOCH FROM (NOW() - p."createdAt")) / 3600) / 24), ${config.timeDecayPower}))
            + ${tagBonus}
            + ${followBonus}
            + ${viewedPenalty}
            + ${diversityPenalty}
                 + CASE WHEN (COALESCE(v.up_votes, 0) + COALESCE(r.reacts, 0) + COALESCE(cm.comments, 0)) > ${config.hotContentThresholds.high} THEN ${config.hotContentMultiplierHigh} 
                   WHEN (COALESCE(v.up_votes, 0) + COALESCE(r.reacts, 0) + COALESCE(cm.comments, 0)) > ${config.hotContentThresholds.medium} THEN ${config.hotContentMultiplierMedium} ELSE 0 END
                 ${jitter}
          ) AS score,
          ${isViewedCheck} as is_viewed,
          CASE WHEN COALESCE(views.views, 0) > 0 THEN (COALESCE(cm.comments, 0)::float / COALESCE(views.views, 1)) * 100 ELSE 0 END as engagement_rate
        FROM blog_posts p
        LEFT JOIN users u ON u.id = p."authorId"
        LEFT JOIN (
          SELECT "postId", COUNT(*)::int AS reacts FROM user_reacts GROUP BY "postId"
        ) r ON r."postId" = p.id
        LEFT JOIN (
          SELECT "postId", COUNT(*)::int AS comments FROM comments GROUP BY "postId"
        ) cm ON cm."postId" = p.id
        LEFT JOIN (
          SELECT "postId",
            SUM(CASE WHEN LOWER("voteType"::text) = 'upvote' THEN 1 ELSE 0 END)::int as up_votes,
            SUM(CASE WHEN LOWER("voteType"::text) = 'downvote' THEN 1 ELSE 0 END)::int as down_votes
          FROM user_votes GROUP BY "postId"
        ) v ON v."postId" = p.id
        LEFT JOIN (
          SELECT "postId", COUNT(DISTINCT "userId")::int as views FROM viewed_history GROUP BY "postId"
        ) views ON views."postId" = p.id
        LEFT JOIN community comm ON comm.id = p."communityId"
        WHERE p."isPublic" = true 
          AND p.status = 'ACTIVE'
          AND p."createdAt" <= NOW()
          AND p."createdAt" > NOW() - INTERVAL '30 days'
      )
      SELECT * FROM ranked
      ${cursorWhere}
      ORDER BY score DESC, id DESC
      LIMIT $${limitParamIndex}
    `;
  }

  // Build cursor WHERE
  private buildCursorWhere(cursor: CursorInfo, params: unknown[]) {
    if (cursor.score !== null && cursor.id !== null) {
      params.push(cursor.score, cursor.id);
      const index = params.length - 1;
      return `WHERE score < $${index} OR (score = $${index} AND id < $${index + 1})`;
    }
    return '';
  }

  

  // Get viewed ids (unchanged)
  private async getViewedIds(userId: number) {
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return await this.viewedHistoryService.getViewedPostIds(userId, since);
    } catch {
      return [];
    }
  }

  // Map rows to DTO (unchanged)
  private mapRowsToDto(
    rawPosts: RawPostRow[],
    hashtagsMap: Record<string, { id: number; name: string }[]>,
    viewedIds: number[],
    reactsMap?: Map<number, any>,
  ): NewsfeedItemDto[] {
    return rawPosts.map((p) => {
      const id = Number(p.id);
      const postPlain: any = {
        id,
        title: p.title || 'Untitled',
        shortDescription: (p as any).short_description || null,
        thumbnailUrl: p.thumbnail_url || null,
        isPublic: Boolean((p as any).is_public ?? true),
        status: (p as any).status || 'ACTIVE',
        type: String(p.post_type || 'PERSONAL'),
        createdAt: p.created_at ? new Date(p.created_at) : new Date(),
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
          : undefined,
        hashtags: hashtagsMap[String(p.id)] || [],
        votes: {
          upvotes: Number(p.up_votes ?? 0),
          downvotes: Number(p.down_votes ?? 0),
          userVote: null,
        },
        reacts: reactsMap?.get(id) ?? null,
      };

      const dto = plainToInstance(PostResponseDto, postPlain, { excludeExtraneousValues: true }) as unknown as NewsfeedItemDto;
      
      // Calculate quality score including emoji reactions
      const upVotes = Number(p.up_votes ?? 0);
      const downVotes = Number(p.down_votes ?? 0);
      const totalReacts = Number(p.total_reacts ?? 0);
      const totalComments = Number(p.total_comments ?? 0);
      const qualityScore = this.calculateQualityScore(upVotes, downVotes, totalReacts, totalComments);
      
      // attach newsfeed-specific fields (final_score now includes quality score)
      (dto as any).final_score = Number(p.score ?? 0) + qualityScore * 0.3; // weight quality score
      (dto as any).isViewed = Boolean(p.is_viewed) || viewedIds.includes(id);
      (dto as any).totalComments = totalComments;
      return dto;
    });
  }

  // Paginate (cursor: '<id>|<score>') — do NOT include seed
  private paginate(items: NewsfeedItemDto[], limit: number) {
    const hasMore = items.length > limit;
    const paginatedItems = hasMore ? items.slice(0, limit) : items;
    const lastItem = paginatedItems[paginatedItems.length - 1];
    const nextCursor =
      hasMore && lastItem
        ? Buffer.from(`${lastItem.id}|${(lastItem as any).final_score}`).toString('base64')
        : null;
    return { paginatedItems, hasMore, nextCursor };
  }

  // Optional quality score (unchanged)
  private calculateQualityScore(
    upVotes: number,
    downVotes: number,
    reacts: number,
    comments: number,
  ): number {
    const n = upVotes + downVotes;
    if (n === 0) return 0;
    const z = 1.96;
    const phat = upVotes / n;
    return (
      (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
      (1 + (z * z) / n)
    );
  }
}
