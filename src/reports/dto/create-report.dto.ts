import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EReportType } from '../enums/report-type.enum';

export class CreateReportDto {
  @ApiProperty({ example: 1, description: 'ID của người báo cáo' })
  @IsNumber()
  reporterId: number;

  @ApiProperty({ example: 'Nội dung không phù hợp', description: 'Lý do báo cáo' })
  @IsString()
  reason: string;

  @ApiProperty({ enum: EReportType, example: 'POST', description: 'Loại báo cáo' })
  @IsEnum(EReportType)
  type: EReportType;

  @ApiPropertyOptional({ example: 1, description: 'ID bài viết bị báo cáo' })
  @IsOptional()
  @IsNumber()
  reportedPostId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID comment bị báo cáo' })
  @IsOptional()
  @IsNumber()
  reportedCommentId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID user bị báo cáo' })
  @IsOptional()
  @IsNumber()
  reportedUserId?: number;
}
