import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { EBlockType, ObjectFit } from '../../enums/block-type.enum';

export class BlockResponseDto {
  @Expose()
  @ApiProperty({ example: 1, description: 'The unique identifier of the block' })
  id: number;

  @Expose()
  @ApiProperty({ example: 10, description: 'The x coordinate of the block' })
  x: number;

  @Expose()
  @ApiProperty({ example: 20, description: 'The y coordinate of the block' })
  y: number;

  @Expose()
  @ApiProperty({ example: 100, description: 'The width of the block' })
  width: number;

  @Expose()
  @ApiProperty({ example: 200, description: 'The height of the block' })
  height: number;

  @Expose()
  @ApiProperty({ example: EBlockType.TEXT, description: 'The type of the block' })
  type: EBlockType;

  @Expose()
  @ApiProperty({ example: 'This is a text block.', description: 'The content of the block' })
  content: string;

  @Expose()
  @ApiProperty({
    example: 'An image caption',
    description: 'The caption of the image block',
    nullable: true,
  })
  imageCaption?: string | null;

  @Expose()
  @ApiProperty({
    example: 'COVER',
    description: 'The object fit property for image blocks',
    nullable: true,
  })
  objectFit?: ObjectFit | null;
}
