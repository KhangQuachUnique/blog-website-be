import { Expose, Type } from 'class-transformer';
import { EEmojiType } from 'src/emojis/enums/emoji.enum';

export class CommunityDTO {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  thumbnailUrl: string;
}

export class EmojiResponseDto {
  @Expose()
  id: number;

  @Expose()
  type: EEmojiType;

  @Expose()
  codepoint?: string;

  @Expose()
  name: string;

  @Expose()
  emojiUrl?: string;

  @Expose()
  communityId: number;
}

export class EmojiCommunityResponseDto {
  @Expose()
  @Type(() => CommunityDTO)
  community: CommunityDTO;

  @Expose()
  @Type(() => EmojiResponseDto)
  emojis: EmojiResponseDto[];
}
