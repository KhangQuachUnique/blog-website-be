import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { EReportType } from '../../enums/report-type.enum';
import { EReportStatus } from '../../enums/report-status.enum';

// ============================================
// 📦 Sub DTOs
// ============================================

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

export class ReportedCommentSummaryDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Comment content preview...' })
  @Expose()
  contentPreview: string;
}

/**
 * DTO cho Meta phân trang (Dùng cho Grouped Response)
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 50 })
  @Expose()
  totalItems: number;

  @ApiProperty({ example: 5 })
  @Expose()
  totalPages: number;

  @ApiProperty({ example: 1 })
  @Expose()
  currentPage: number;

  @ApiProperty({ example: 10 })
  @Expose()
  itemsPerPage: number;
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

  @ApiProperty({ enum: EReportStatus, example: 'PENDING' })
  @Expose()
  status: EReportStatus;

  @ApiProperty({ example: '2024-12-18T10:30:00Z' })
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ example: '2024-12-19T10:30:00Z', description: 'Thời gian báo cáo được giải quyết' })
  @Expose()
  resolvedAt?: Date;

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
 * Response DTO cho list reports cơ bản (Không group)
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
 * Response DTO cho Grouped Report Item
 */
export class GroupedReportResponseDto extends ReportResponseDto {
  @ApiProperty({ example: 5, description: 'Tổng số báo cáo cho đối tượng này' })
  @Expose()
  totalReports: number;

  @ApiProperty({ example: 'Spam nội dung', description: 'Lý do báo cáo gần nhất' })
  @Expose()
  latestReason: string;

  @ApiProperty({ type: [ReportResponseDto], description: 'Danh sách các báo cáo chi tiết trong nhóm' })
  @Expose()
  @Type(() => ReportResponseDto)
  reportsList: ReportResponseDto[];
}

/**
 * Response Wrapper cho danh sách Grouped Reports
 */
export class GroupedReportListResponseDto {
  @ApiProperty({ type: [GroupedReportResponseDto] })
  @Expose()
  @Type(() => GroupedReportResponseDto)
  items: GroupedReportResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  @Expose()
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;
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