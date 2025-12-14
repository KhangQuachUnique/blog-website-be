import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EBlockType, ObjectFit } from '../enums/block-type.enum';

export class CreateBlockDto {
  @ApiProperty({ description: 'Vị trí x', example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  x: number;

  @ApiProperty({ description: 'Vị trí y', example: 0, minimum: 0 })
  @IsInt()
  @Min(0)
  y: number;

  @ApiProperty({ description: 'Chiều rộng', example: 12, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(16)
  width: number;

  @ApiProperty({ description: 'Chiều cao', example: 100, minimum: 1 })
  @IsInt()
  @Min(1)
  height: number;

  @ApiProperty({
    description: 'Loại block',
    enum: EBlockType,
    example: EBlockType.TEXT,
  })
  @IsEnum(EBlockType, {
    message: 'Block type must be TEXT or IMAGE',
  })
  @IsNotEmpty()
  type: EBlockType;

  @ApiProperty({
    description: 'Nội dung block (text hoặc URL ảnh)',
    example: 'Đây là nội dung block text',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Chú thích ảnh',
    example: 'Đây là chú thích ảnh',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  imageCaption?: string | null;

  @ApiProperty({
    description: 'Thuộc tính object fit cho block ảnh',
    example: 'COVER',
    nullable: true,
  })
  @IsEnum(ObjectFit, {
    message: 'Object fit must be CONTAIN, COVER, or FILL',
  })
  @IsOptional()
  objectFit?: ObjectFit | null;
}
