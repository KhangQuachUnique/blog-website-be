import { PartialType } from '@nestjs/mapped-types';
import { CreateViewedHistoryDto } from './create-viewed-history.dto';

export class UpdateViewedHistoryDto extends PartialType(CreateViewedHistoryDto) {}
