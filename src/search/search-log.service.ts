import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { SearchLog } from './entities/search-log.entity';

export interface LogSearchParams {
  keyword: string;
  searchType?: string;
  userId?: number | null;
  resultsCount?: number;
}

export interface TopKeywordDto {
  keyword: string;
  count: number;
}

@Injectable()
export class SearchLogService {
  constructor(
    @InjectRepository(SearchLog)
    private readonly searchLogRepository: Repository<SearchLog>,
  ) {}

  /**
   * Log search query asynchronously (fire and forget)
   * Không await để không block response
   */
  logSearch(params: LogSearchParams): void {
    const { keyword, searchType = 'all', userId = null, resultsCount = 0 } = params;

    // Normalize keyword
    const normalizedKeyword = keyword.trim().toLowerCase();

    // Skip empty keywords
    if (!normalizedKeyword || normalizedKeyword.length < 2) {
      return;
    }

    // Fire and forget - không await
    this.searchLogRepository
      .save({
        keyword: normalizedKeyword,
        searchType,
        userId,
        resultsCount,
      })
      .catch((error) => {
        // Log error nhưng không throw
        console.error('Failed to log search:', error.message);
      });
  }

  /**
   * Lấy top keywords theo khoảng thời gian
   */
  async getTopKeywords(
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<TopKeywordDto[]> {
    const result = await this.searchLogRepository
      .createQueryBuilder('log')
      .select('log.keyword', 'keyword')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('log.keyword')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((row) => ({
      keyword: row.keyword,
      count: parseInt(row.count, 10),
    }));
  }

  /**
   * Lấy tổng số lượt tìm kiếm theo khoảng thời gian
   */
  async getTotalSearches(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.searchLogRepository.count({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });
    return result;
  }

  /**
   * Lấy số lượt tìm kiếm theo ngày (cho chart)
   */
  async getSearchesByDate(
    startDate: Date,
    endDate: Date,
  ): Promise<{ date: string; count: number }[]> {
    const result = await this.searchLogRepository
      .createQueryBuilder('log')
      .select("DATE(log.createdAt)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('DATE(log.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((row) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));
  }
}
