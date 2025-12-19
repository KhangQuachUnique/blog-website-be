import { IsOptional, IsEnum, IsDateString } from 'class-validator';

export enum EPeriod {
  TODAY = 'today',
  SEVEN_DAYS = '7days',
  THIRTY_DAYS = '30days',
  CUSTOM = 'custom',
}

export class DashboardFilterDto {
  @IsOptional()
  @IsEnum(EPeriod)
  period?: EPeriod = EPeriod.SEVEN_DAYS;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
