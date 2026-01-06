import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateEmojiDto {
  @IsString()
  @IsNotEmpty()
  emojiUrl: string;

  @IsNumber()
  @IsNotEmpty()
  communityId: number;
}
