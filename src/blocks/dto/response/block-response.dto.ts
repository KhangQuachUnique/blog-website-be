import { ApiProperty } from '@nestjs/swagger';
import { EBlockType } from 'src/blocks/enums/block-type.enum';

export class BlockResponseDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the block' })
  id: number;

  @ApiProperty({ example: 10, description: 'The x coordinate of the block' })
  x: number;

  @ApiProperty({ example: 20, description: 'The y coordinate of the block' })
  y: number;

  @ApiProperty({ example: 100, description: 'The width of the block' })
  width: number;

  @ApiProperty({ example: 200, description: 'The height of the block' })
  height: number;

  @ApiProperty({ example: EBlockType.TEXT, description: 'The type of the block' })
  type: EBlockType;

  @ApiProperty({ example: 'This is a text block.', description: 'The content of the block' })
  content: string;

  @ApiProperty({
    example: 'An image caption',
    description: 'The caption of the image block',
    nullable: true,
  })
  imageCaption: string | null;

  @ApiProperty({
    example: 'COVER',
    description: 'The object fit property for image blocks',
    nullable: true,
  })
  objectFit: string | null;
}
