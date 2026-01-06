import { IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EReportType } from '../enums/report-type.enum';
import { EReportStatus } from '../enums/report-status.enum';

export class GetGroupedReportsDto {
  @IsOptional()
  @IsEnum(EReportStatus)
  status?: EReportStatus;

  @IsOptional()
  @IsEnum(EReportType)
  type?: EReportType; // Nếu null => Mặc định lấy POST hoặc phải handle logic ALL

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}