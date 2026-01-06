import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEmojiDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  emojiUrl: string;
}
