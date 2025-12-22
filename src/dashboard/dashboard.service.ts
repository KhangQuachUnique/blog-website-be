import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { BlogPost } from 'src/blog-posts/entities/blog-post.entity';
import { Comment } from 'src/comments/entities/comment.entity';
import { Community } from 'src/communities/entities/community.entity';
import { UserVote } from 'src/user-votes/entities/user-vote.entity';
import {
  DashboardFilterDto,
  EPeriod,
} from './dto/dashboard-filter.dto';
import {
  StatsCardDto,
  DashboardChartsDto,
  ChartDataPointDto,
  DashboardStatsResponseDto,
  DashboardChartsResponseDto,
} from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BlogPost)
    private blogPostRepository: Repository<BlogPost>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
    @InjectRepository(UserVote)
    private userVoteRepository: Repository<UserVote>,
  ) {}

  /**
   * Calculate date range based on filter period
   * Made public for controller to use
   */
  getDateRange(filter: DashboardFilterDto): {
    startDate: Date;
    endDate: Date;
    label: string;
  } {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    let startDate: Date;
    let label: string;

    switch (filter.period) {
      case EPeriod.TODAY:
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        label = 'Hôm nay';
        break;

      case EPeriod.SEVEN_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        label = '7 ngày qua';
        break;

      case EPeriod.THIRTY_DAYS:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        label = '30 ngày qua';
        break;

      case EPeriod.CUSTOM:
        if (filter.startDate && filter.endDate) {
          startDate = new Date(filter.startDate);
          startDate.setHours(0, 0, 0, 0);
          const customEnd = new Date(filter.endDate);
          customEnd.setHours(23, 59, 59, 999);
          label = `${filter.startDate} - ${filter.endDate}`;
          return { startDate, endDate: customEnd, label };
        }
        // Fallback to 7 days if custom dates not provided
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        label = '7 ngày qua';
        break;

      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        label = '7 ngày qua';
    }

    return { startDate, endDate, label };
  }

  /**
   * Get dashboard statistics (cards data)
   */
  async getStats(filter: DashboardFilterDto): Promise<DashboardStatsResponseDto> {
    const { startDate, endDate, label } = this.getDateRange(filter);

    // Execute all count queries in parallel for better performance
    const [
      totalUsers,
      newUsers,
      totalPosts,
      newPosts,
      totalComments,
      newComments,
      totalCommunities,
      newVotes,
    ] = await Promise.all([
      // Total users (all time)
      this.userRepository.count(),

      // New users in period
      this.userRepository.count({
        where: {
          joinAt: Between(startDate, endDate),
        },
      }),

      // Total posts (all time, excluding drafts)
      this.blogPostRepository.count(),

      // New posts in period
      this.blogPostRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
        },
      }),

      // Total comments (all time)
      this.commentRepository.count(),

      // New comments in period
      this.commentRepository.count({
        where: {
          createAt: Between(startDate, endDate),
        },
      }),

      // Total communities (all time)
      this.communityRepository.count(),

      // New votes in period (interactions)
      this.userVoteRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
        },
      }),
    ]);

    const stats: StatsCardDto = {
      totalUsers,
      newUsers,
      totalPosts,
      newPosts,
      totalComments,
      newComments,
      totalCommunities,
      totalInteractions: newVotes + newComments, // votes + comments in period
    };

    return {
      stats,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        label,
      },
    };
  }

  /**
   * Get chart data (growth over time)
   */
  async getCharts(filter: DashboardFilterDto): Promise<DashboardChartsResponseDto> {
    const { startDate, endDate, label } = this.getDateRange(filter);

    // Execute all chart queries in parallel
    const [userGrowthRaw, postGrowthRaw, commentGrowthRaw] = await Promise.all([
      // User growth by date
      this.userRepository
        .createQueryBuilder('user')
        .select("TO_CHAR(user.joinAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(*)', 'count')
        .where('user.joinAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .groupBy("TO_CHAR(user.joinAt, 'YYYY-MM-DD')")
        .orderBy('date', 'ASC')
        .getRawMany(),

      // Post growth by date
      this.blogPostRepository
        .createQueryBuilder('post')
        .select("TO_CHAR(post.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(*)', 'count')
        .where('post.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .groupBy("TO_CHAR(post.createdAt, 'YYYY-MM-DD')")
        .orderBy('date', 'ASC')
        .getRawMany(),

      // Comment growth by date
      this.commentRepository
        .createQueryBuilder('comment')
        .select("TO_CHAR(comment.createAt, 'YYYY-MM-DD')", 'date')
        .addSelect('COUNT(*)', 'count')
        .where('comment.createAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .groupBy("TO_CHAR(comment.createAt, 'YYYY-MM-DD')")
        .orderBy('date', 'ASC')
        .getRawMany(),
    ]);

    // Fill in missing dates with 0 count
    const userGrowth = this.fillMissingDates(userGrowthRaw, startDate, endDate);
    const postGrowth = this.fillMissingDates(postGrowthRaw, startDate, endDate);
    const commentGrowth = this.fillMissingDates(commentGrowthRaw, startDate, endDate);

    const charts: DashboardChartsDto = {
      userGrowth,
      postGrowth,
      commentGrowth,
    };

    return {
      charts,
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        label,
      },
    };
  }

  /**
   * Fill missing dates in chart data with 0 count
   */
  private fillMissingDates(
    rawData: { date: string; count: string }[],
    startDate: Date,
    endDate: Date,
  ): ChartDataPointDto[] {
    // Create a map for quick lookup
    const dataMap = new Map<string, number>();
    rawData.forEach((item) => {
      dataMap.set(item.date, parseInt(item.count, 10));
    });

    // Generate all dates in range
    const result: ChartDataPointDto[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }
}
