import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EReportType } from '../enums/report-type.enum';

export class ResolveReportDto {
  @ApiProperty({ enum: EReportType })
  @IsEnum(EReportType)
  @IsNotEmpty()
  type: EReportType;

  @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
  @IsEnum(['APPROVE', 'REJECT'])
  @IsNotEmpty()
  action: 'APPROVE' | 'REJECT';
}