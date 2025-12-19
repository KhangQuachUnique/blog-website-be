import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { EReportType } from '../../enums/report-type.enum';

// ============================================
// 📦 Sub DTOs
// ============================================

/**
 * Reporter summary trong response
 */
export class ReporterSummaryDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'johndoe' })
  @Expose()
  username: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatarUrl?: string;
}

/**
 * Reported user summary
 */
export class ReportedUserSummaryDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'baduser' })
  @Expose()
  username: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @Expose()
  avatarUrl?: string;
}

/**
 * Reported post summary
 */
export class ReportedPostSummaryDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Post title here' })
  @Expose()
  title: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg' })
  @Expose()
  thumbnailUrl?: string;
}

/**
 * Reported comment summary
 */
export class ReportedCommentSummaryDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Comment content preview...' })
  @Expose()
  contentPreview: string;
}

// ============================================
// 📦 Main Response DTOs
// ============================================

/**
 * Response DTO cho single report
 */
export class ReportResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Nội dung không phù hợp' })
  @Expose()
  reason: string;

  @ApiProperty({ enum: EReportType, example: 'POST' })
  @Expose()
  type: EReportType;

  @ApiProperty({ example: '2024-12-18T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: ReporterSummaryDto })
  @Expose()
  @Type(() => ReporterSummaryDto)
  reporter: ReporterSummaryDto;

  @ApiPropertyOptional({ type: ReportedUserSummaryDto })
  @Expose()
  @Type(() => ReportedUserSummaryDto)
  reportedUser?: ReportedUserSummaryDto;

  @ApiPropertyOptional({ type: ReportedPostSummaryDto })
  @Expose()
  @Type(() => ReportedPostSummaryDto)
  reportedPost?: ReportedPostSummaryDto;

  @ApiPropertyOptional({ type: ReportedCommentSummaryDto })
  @Expose()
  @Type(() => ReportedCommentSummaryDto)
  reportedComment?: ReportedCommentSummaryDto;
}

/**
 * Response DTO cho list reports với pagination
 */
export class ReportListResponseDto {
  @ApiProperty({ type: [ReportResponseDto] })
  @Expose()
  @Type(() => ReportResponseDto)
  items: ReportResponseDto[];

  @ApiProperty({ example: 50 })
  @Expose()
  total: number;

  @ApiProperty({ example: 1 })
  @Expose()
  page: number;

  @ApiProperty({ example: 20 })
  @Expose()
  limit: number;

  @ApiProperty({ example: 3 })
  @Expose()
  totalPages: number;
}

/**
 * Response sau khi tạo report thành công
 */
export class CreateReportResponseDto {
  @ApiProperty({ example: 'Báo cáo đã được gửi thành công' })
  @Expose()
  message: string;

  @ApiProperty({ example: 1 })
  @Expose()
  reportId: number;
}

/**
 * Response check if already reported
 */
export class CheckReportedResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  isReported: boolean;

  @ApiPropertyOptional({ example: 1 })
  @Expose()
  reportId?: number;
}
