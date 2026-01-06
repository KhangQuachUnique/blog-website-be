import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EReportType } from '../enums/report-type.enum';
import { EReportStatus } from '../enums/report-status.enum';

export class GetGroupedReportsDto {
  @IsOptional()
  @IsEnum(EReportStatus)
  status?: EReportStatus;

  @IsOptional()
  @IsEnum(EReportType)
  type?: EReportType;

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

  @IsOptional()
  @IsString()
  search?: string;
}