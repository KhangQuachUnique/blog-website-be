import { IsEnum, IsNumber } from 'class-validator';

export enum ReactType {
  EMOJI = 'emoji',
  CUSTOM_EMOJI = 'custom_emoji',
}

export class CreateReactDto {
  @IsEnum(ReactType)
  type: ReactType;

  @IsNumber()
  userId: number;

  @IsNumber()
  postId: number;

  @IsNumber()
  commentId: number;

  // Cho emoji react thường hoặc custom emoji của forum
  emojiId?: number; // FK to emojis table (custom emojis)
  
  // TODO: Có thể cần thêm field cho emoji thường (Unicode)
}

export class ReactStatsDto {
  totalReacts: number;
  emojiBreakdown: {
    emojiId?: number;
    emojiUrl?: string;
    count: number;
  }[];
}