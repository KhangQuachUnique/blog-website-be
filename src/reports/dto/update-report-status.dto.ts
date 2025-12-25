import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EReportStatus } from '../enums/report-status.enum';

export class UpdateReportStatusDto {
    @ApiProperty({
        enum: EReportStatus,
        example: EReportStatus.PENDING,
        description: 'Trạng thái báo cáo',
    })
    @IsNotEmpty()
    @IsEnum(EReportStatus)
    status: EReportStatus;
}