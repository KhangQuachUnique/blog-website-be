import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { EmojisService } from './emojis.service';
import { CreateEmojiDto } from './dto/create-emoji.dto';
import { UpdateEmojiDto } from './dto/update-emoji.dto';
import { Emoji } from './entities/emoji.entity';

@Controller('emojis')
export class EmojisController {
  constructor(private readonly emojisService: EmojisService) {}

  @Post()
  async create(@Body() createEmojiDto: CreateEmojiDto): Promise<Emoji> {
    return this.emojisService.create(createEmojiDto);
  }

  @Get()
  async findAll(): Promise<Emoji[]> {
    return this.emojisService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Emoji> {
    return this.emojisService.findOne(id);
  }

  @Get('community/:communityId')
  async findByCommunity(@Param('communityId', ParseIntPipe) communityId: number): Promise<Emoji[]> {
    return this.emojisService.findByCommunity(communityId);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmojiDto: UpdateEmojiDto,
  ): Promise<Emoji> {
    return this.emojisService.update(id, updateEmojiDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.emojisService.remove(id);
  }
}
