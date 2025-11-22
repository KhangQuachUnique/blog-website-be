import { PartialType } from '@nestjs/mapped-types';
import { CreateSavedPostListDto } from './create-saved-post-list.dto';

export class UpdateSavedPostListDto extends PartialType(CreateSavedPostListDto) {}
