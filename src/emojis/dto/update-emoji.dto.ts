import { PartialType } from '@nestjs/mapped-types';
import { CreateEmojiDto } from './create-emoji.dto';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEmojiDto extends PartialType(CreateEmojiDto) {
  @IsString()
  @IsOptional()
  emojiUrl?: string;

  @IsNumber()
  @IsOptional()
  communityId?: number;
}
